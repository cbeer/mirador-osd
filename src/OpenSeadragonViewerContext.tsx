import Openseadragon from 'openseadragon';
import { MutableRefObject, createContext } from 'react';


const ViewerContext = createContext<MutableRefObject<Openseadragon.Viewer | undefined> | undefined>(undefined);

export default ViewerContext
