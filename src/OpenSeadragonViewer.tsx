import Openseadragon from 'openseadragon';
import { Children, useEffect, useId, useRef, useReducer, useState, useCallback, useImperativeHandle, forwardRef, cloneElement, ElementType } from 'react';
import OpenSeadragonViewerContext from './OpenSeadragonViewerContext';
import { useDebouncedCallback } from 'use-debounce';

interface OpenseadragonViewerProps {
  children?: React.ReactElement,
  Container?: ElementType,
  osdConfig?: Openseadragon.Options & {
    zoomPerDoubleClick?: number
  },
  viewerConfig?: {
    bounds?: [number, number, number, number],
    flip?: boolean,
    rotation?: number,
    x?: number,
    y?: number,
    zoom?: number,
  },
  onUpdateViewport?: ({ bounds, flip, rotation, x, y, zoom }: { bounds: [number, number, number, number], flip: boolean, rotation: number, x: number, y: number, zoom: number}) => void,
  style?: React.CSSProperties,
}

const OpenseadragonViewer = forwardRef(function OpenseadragonViewer({ children = undefined, Container = 'div', osdConfig = {}, viewerConfig = {}, onUpdateViewport = ({}) => {}, style = {}, ...passThruProps }: OpenseadragonViewerProps, ref): JSX.Element {
  const id = useId();
  const [grabbing, setGrabbing] = useState<boolean>(false);
  const viewerRef = useRef<Openseadragon.Viewer | undefined>(undefined);
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  useImperativeHandle(ref, () => viewerRef.current, [viewerRef.current]);

  const moveHandler = useDebouncedCallback(useCallback((event: any) => {
    /** Shim to provide a mouse-move event coming from the viewer */
    viewerRef.current?.raiseEvent('mouse-move', event);
  }, [viewerRef]), 10);

  const onViewportChange = useCallback((event: any ) => {
    const { viewport } = event.eventSource;

    onUpdateViewport({
      bounds: viewport.getBounds(),
      flip: viewport.getFlip(),
      rotation: viewport.getRotation(),
      x: Math.round(viewport.centerSpringX.target.value),
      y: Math.round(viewport.centerSpringY.target.value),
      zoom: viewport.zoomSpring.target.value,
    });
  }, [onUpdateViewport]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    
    const { viewport } = viewer;
    
    // @ts-expect-error
    if (viewerConfig.x && viewerConfig.y && (Math.round(viewerConfig.x) !== Math.round(viewport.centerSpringX.target.value)
      // @ts-expect-error
      || Math.round(viewerConfig.y) !== Math.round(viewport.centerSpringY.target.value))) {
        viewport.panTo(new Openseadragon.Point(viewerConfig.x, viewerConfig.y), false);
      }

      // @ts-expect-error
      if (viewerConfig.zoom && viewerConfig.zoom !== viewport.zoomSpring.target.value) {
        viewport.zoomTo(viewerConfig.zoom, new Openseadragon.Point(viewerConfig.x, viewerConfig.y), false);
      }
      
      if (viewerConfig.rotation && viewerConfig.rotation !== viewport.getRotation()) {
        viewport.setRotation(viewerConfig.rotation);
      }
      
      if (viewerConfig.flip !== undefined && (viewerConfig.flip || false) !== viewport.getFlip()) {
        viewport.setFlip(viewerConfig.flip);
      }
  
      if (viewerConfig.bounds && !viewerConfig.x && !viewerConfig.y && !viewerConfig.zoom) {
        const rect = new Openseadragon.Rect(...viewerConfig.bounds);
        if (rect.equals(viewport.getBounds())) {
          viewport.fitBounds(rect, false);
        }
      }
  }, [viewerConfig]);

  useEffect(() => {
    const viewer = Openseadragon({
      id,
      prefixUrl: 'https://openseadragon.github.io/openseadragon/images/',
      ...osdConfig,
    });

    viewer.addHandler('canvas-drag', () => {
      setGrabbing(true);
    });

    viewer.addHandler('canvas-drag-end', () => {
      setGrabbing(false);
    });

    viewer.addHandler('canvas-double-click', ({ position, shift }) => {
      if (!osdConfig.zoomPerDoubleClick) return;

      const currentZoom = viewer.viewport.getZoom();
      const zoomRatio = (shift ? 1.0 / osdConfig.zoomPerDoubleClick : osdConfig.zoomPerDoubleClick);
      viewer.viewport.zoomTo(currentZoom * zoomRatio, viewer.viewport.pointFromPixel(position), false);
    });

    viewer.addHandler('animation-finish', onViewportChange);
    // @ts-expect-error
    viewer.innerTracker.moveHandler = moveHandler;

    viewerRef.current = viewer;
    viewer.addOnceHandler('viewport-change', () => {
      const { viewport } = viewer;

      if (viewerConfig.x !== undefined && viewerConfig.y !== undefined) {
        viewport.panTo(new Openseadragon.Point(viewerConfig.x, viewerConfig.y), true);
      }

      if (viewerConfig.zoom !== undefined) {
        viewport.zoomTo(viewerConfig.zoom, new Openseadragon.Point(viewerConfig.x, viewerConfig.y), true);
      }
        
      if (viewerConfig.rotation && viewerConfig.rotation !== viewport.getRotation()) {
        viewport.setRotation(viewerConfig.rotation);
      }
        
      if (viewerConfig.flip !== undefined && (viewerConfig.flip || false) !== viewport.getFlip()) {
        viewport.setFlip(viewerConfig.flip);
      }

      if (!viewerConfig.x && !viewerConfig.y && !viewerConfig.zoom) {
        if (viewerConfig.bounds) {
          viewport.fitBounds(new Openseadragon.Rect(...viewerConfig.bounds), true);
        } else {
          viewport.goHome();
        }
      }
    });

    forceUpdate();
  }, [id]);
  
  useEffect(() => {
    const canvas = viewerRef?.current?.canvas?.firstElementChild;
    if (canvas) {
      canvas.setAttribute('role', 'img');
      // canvas.setAttribute('aria-label', t('digitizedView'));
      // canvas.setAttribute('aria-describedby', `${windowId}-osd`);
    }
  }, [viewerRef?.current?.canvas?.firstElementChild])

  useEffect(() => {
    return () => {
      const viewer = viewerRef.current;

      if (!viewer) return;

      // onCanvasMouseMove.cancel();
      // @ts-expect-error
      if (viewer.innerTracker?.moveHandler === moveHandler) {
        // @ts-expect-error
        viewer.innerTracker.moveHandler = () => {};
      }
      // @ts-expect-error
      viewer.removeAllHandlers();

      viewer.destroy();
      viewerRef.current = undefined;
    };
  }, []);

  return (
    <OpenSeadragonViewerContext.Provider value={viewerRef}>
      <Container id={id} style={{ ...style, cursor: grabbing ? 'grabbing' : 'grab' }} {...passThruProps}>
        {Children.map(children, child => (cloneElement(child as React.ReactElement<any>, { viewer: viewerRef })))}
      </Container>
    </OpenSeadragonViewerContext.Provider>
  )
});

export default OpenseadragonViewer;
