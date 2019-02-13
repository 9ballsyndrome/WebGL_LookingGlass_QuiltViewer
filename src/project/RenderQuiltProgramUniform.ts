import {UniformBufferObject} from '../webgl/UniformBufferObject';

export class RenderQuiltProgramUniform extends UniformBufferObject
{
  public static readonly BUFFER_LENGTH:number = 12;

  // Layout
  // 0     = float pitch
  // 1     = float tilt
  // 2     = float center
  // 3     = float invView

  // 4-5   = vec2 flip
  // 6-7   = vec2 tiles

  // 8     = float subp
  // 9-11  = float padding

  public get pitch():number
  {
    return this._bufferData[0];
  }

  public set pitch(value:number)
  {
    this._copyNumberData(value, 0);
  }

  public get tilt():number
  {
    return this._bufferData[1];
  }

  public set tilt(value:number)
  {
    this._copyNumberData(value, 1);
  }

  public get center():number
  {
    return this._bufferData[2];
  }

  public set center(value:number)
  {
    this._copyNumberData(value, 2);
  }

  public get invView():number
  {
    return this._bufferData[3];
  }

  public set invView(value:number)
  {
    this._copyNumberData(value, 3);
  }

  public get flip():Float32Array
  {
    return this._bufferData.subarray(4, 6);
  }

  public set flip(value:Float32Array)
  {
    this._copyData(value, 4, 2);
  }

  public get tiles():Float32Array
  {
    return this._bufferData.subarray(6, 8);
  }

  public set tiles(value:Float32Array)
  {
    this._copyData(value, 6, 2);
  }

  public get subp():number
  {
    return this._bufferData[8];
  }

  public set subp(value:number)
  {
    this._copyNumberData(value, 8);
  }

  constructor(name:string, binding:number)
  {
    super(name, binding);
    this._bufferDataLength = RenderQuiltProgramUniform.BUFFER_LENGTH;
  }
}
