import Openseadragon from 'openseadragon';
import { useContext, useEffect, useRef } from 'react';
import OpenSeadragonViewerContext from './OpenSeadragonViewerContext';

interface TileSourceProps {
  index?: number,
  opacity?: number,
  fitBounds?: [number, number, number, number],
  tileSource?: any,
  url?: string
}

export default function TileSource({ index = undefined, opacity = undefined, fitBounds = undefined, tileSource = {}, url = undefined }: TileSourceProps): null {
  const viewer = useContext(OpenSeadragonViewerContext);
  const tiledImage = useRef<Openseadragon.TiledImage | undefined>(undefined);

  useEffect(() => {
    if (!opacity) return;

    tiledImage.current?.setOpacity(opacity);
  }, [opacity]);

  useEffect(() => {
    if (!fitBounds) return;

    tiledImage.current?.fitBounds(new Openseadragon.Rect(...fitBounds));
  }, [fitBounds]);

  useEffect(() => {
    if (!tiledImage.current || !viewer?.current || !index) return;

    viewer.current.world.setItemIndex(tiledImage.current, index);
  }, [index, viewer]);

  useEffect(() => {
    if (!viewer?.current) return;

    const promise = new Promise((resolve, reject) => {
      // OSD mutates this object, so we give it a shallow copy
      const localTileSource = url ? { type: 'image', url: url } : ((typeof tileSource === "string" || tileSource instanceof String) ? tileSource : { ...tileSource });

      viewer.current?.addTiledImage({
        error: (event: any) => reject(event),
        fitBounds: (fitBounds ? new Openseadragon.Rect(...fitBounds) : undefined),
        index: index,
        opacity: opacity,
        success: (event: any) => resolve(event),
        tileSource: localTileSource,
      });
    }).then((event: any) => {
      tiledImage.current = event.item;
    }).catch((event) => {
      console.error('Error loading tile source', event);
    });

    return () => {
      promise.finally(() => {
        if (viewer?.current && tiledImage.current) {
          viewer.current.world.removeItem(tiledImage.current);
        }
      });
    };
  }, [viewer?.current, url]);

  return null;
};
