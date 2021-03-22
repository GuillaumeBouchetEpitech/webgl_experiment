
import { GeometryWrapper } from "../rendererWebGL/utils/Geometry";
import ChunkGenerator from "../generation/ChunkGenerator";

interface Logic {
    // force_forward: boolean;
    k_chunk_size: number;
    chunkGenerator: ChunkGenerator;
};

// singleton
class Data {

    // public arr_touches: any[] = [];
    public logic: Logic = {
        // force_forward: false,
        k_chunk_size: 15,
        chunkGenerator: new ChunkGenerator(),
    };
    public force_forward: boolean = false;

    public chunk_is_visible: ((pos: [number, number, number]) => void) | null = null;
    public point_is_visible: ((pos: [number, number, number]) => void) | null = null;
    public add_geom: ((buffer: Float32Array) => GeometryWrapper.Geometry) | null = null;
    public update_geom: ((geom: GeometryWrapper.Geometry, buffer: Float32Array) => void) | null = null;
};

const g_data = new Data();

export default g_data;
