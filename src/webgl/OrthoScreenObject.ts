import {mat4, vec3} from 'gl-matrix';
import {Geometry, VertexAttribute} from './Geometry';

export class OrthoScreenObject extends Geometry
{
  protected _bufferData:Float32Array;

  public get bufferData():Float32Array
  {
    return this._bufferData;
  }

  protected _indeces:Uint16Array;

  public get indeces():Uint16Array
  {
    return this._indeces;
  }

  public _screenMatrix:mat4;

  public get screenMatrix():mat4
  {
    return this._screenMatrix;
  }

  constructor()
  {
    super();
    this.init();
  }

  public init():void
  {
    this._bufferData = new Float32Array([
      -1.0, 1.0, 0.0, /**/ 0.0, 0.0,
      1.0, 1.0, 0.0, /**/ 1.0, 0.0,
      -1.0, -1.0, 0.0, /**/ 0.0, 1.0,
      1.0, -1.0, 0.0, /**/ 1.0, 1.0,
    ]);
    this._indeces = new Uint16Array([
      0, 1, 2,
      3, 2, 1
    ]);
    this._numIndices = this._indeces.length;

    const viewMtx:mat4 = mat4.identity(mat4.create());
    const projectionMtx:mat4 = mat4.identity(mat4.create());
    this._screenMatrix = mat4.identity(mat4.create());
    mat4.lookAt(viewMtx, vec3.fromValues(0.0, 0.0, 0.5), vec3.fromValues(0.0, 0.0, 0.0), vec3.fromValues(0.0, 1.0, 0.0));
    mat4.ortho(projectionMtx, -1.0, 1.0, 1.0, -1.0, 0.1, 1);
    mat4.multiply(this._screenMatrix, projectionMtx, viewMtx);
  }

  public createBuffer(gl:WebGLRenderingContext):void
  {
    let buffer:WebGLBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._bufferData), gl.STATIC_DRAW);

    const positionAttribute:VertexAttribute = {
      name:'position',
      byteStride:20,
      bufferOffset:0,
      buffer:buffer,
      divisor:-1
    };
    this.vboList.push(positionAttribute);

    const uvAttribute:VertexAttribute = {
      name:'uv',
      byteStride:20,
      bufferOffset:12,
      buffer:buffer,
      divisor:-1
    };
    this.vboList.push(uvAttribute);

    this._indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this._indeces, gl.STATIC_DRAW);
  }
}
