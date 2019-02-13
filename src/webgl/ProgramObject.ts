import {mat4, vec2, vec3, vec4} from 'gl-matrix';
import {UniformBufferObject} from './UniformBufferObject';

export class ProgramObject
{
  protected _program:WebGLProgram;

  public get program():WebGLProgram
  {
    return this._program;
  }

  protected _attributeList:ShaderAttribute[];

  public get attributeList():ShaderAttribute[]
  {
    return this._attributeList;
  }

  protected _uniformBufferObjectList:UniformBufferObject[];

  public get uniformBufferObjectList():UniformBufferObject[]
  {
    return this._uniformBufferObjectList;
  }

  protected _uniformList:ShaderUniform[];

  public get uniformList():ShaderUniform[]
  {
    return this._uniformList;
  }

  protected _vertexShaderSource:string;
  protected _fragmentShaderSource:string;

  constructor()
  {
    this._uniformBufferObjectList = [];
    this._uniformList = [];
    this._attributeList = [];
    this.init();
  }

  protected init():void
  {

  }

  public creatProgram(gl2:WebGL2RenderingContext):void
  {
    const vShader:WebGLShader = this.creatShader(gl2, this._vertexShaderSource, gl2.VERTEX_SHADER);
    const fShader:WebGLShader = this.creatShader(gl2, this._fragmentShaderSource, gl2.FRAGMENT_SHADER);

    this._program = gl2.createProgram();
    gl2.attachShader(this._program, vShader);
    gl2.attachShader(this._program, fShader);

    gl2.linkProgram(this._program);

    let i:number;
    let length:number;

    length = this._attributeList.length;
    for(i = 0; i < length; i++)
    {
      const attribute:ShaderAttribute = this._attributeList[i];
      if(attribute.location === -1)
      {
        attribute.location = gl2.getAttribLocation(this._program, attribute.name);
      }
    }

    length = this._uniformBufferObjectList.length;
    for(i = 0; i < length; i++)
    {
      const uniform:UniformBufferObject = this._uniformBufferObjectList[i];
      uniform.index = gl2.getUniformBlockIndex(this._program, uniform.name);
    }

    length = this._uniformList.length;
    for(i = 0; i < length; i++)
    {
      const uniform:ShaderUniform = this._uniformList[i];
      uniform.location = gl2.getUniformLocation(this._program, uniform.name);
    }
  }

  private creatShader(gl:WebGLRenderingContext, source:string, type:number):WebGLShader
  {
    const shader:WebGLShader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if(gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    {
      return shader;
    }
    else
    {
      console.log(type === gl.VERTEX_SHADER, gl.getShaderInfoLog(shader));
      return null;
    }
  }

  public bindShader(gl2:WebGL2RenderingContext):void
  {
    this.bindProgram(gl2);
    this.bindUniformObject(gl2);
    this.bindUniform(gl2);
  }

  public bindProgram(gl:WebGLRenderingContext):void
  {
    if(gl.getProgramParameter(this._program, gl.LINK_STATUS))
    {
      gl.useProgram(this._program);
    }
    else
    {
      console.log(gl.getProgramInfoLog(this._program));
    }
  }

  public bindUniformObject(gl2:WebGL2RenderingContext):void
  {
    const length:number = this._uniformBufferObjectList.length;
    for(let i:number = 0; i < length; i++)
    {
      const uniform:UniformBufferObject = this._uniformBufferObjectList[i];
      gl2.bindBufferBase(gl2.UNIFORM_BUFFER, uniform.binding, uniform.buffer);
      gl2.uniformBlockBinding(this.program, uniform.index, uniform.binding);
    }
  }

  public bindUniform(gl:WebGLRenderingContext):void
  {
    const length:number = this.uniformList.length;
    for(let i:number = 0; i < length; i++)
    {
      const uniform:ShaderUniform = this.uniformList[i];
      switch(uniform.type)
      {
        case UniformType.MATRIX4:
          gl.uniformMatrix4fv(uniform.location, false, uniform.matrix4);
          break;
        case UniformType.FLOAT:
          gl.uniform1f(uniform.location, uniform.float);
          break;
        case UniformType.VECTOR2:
          gl.uniform2fv(uniform.location, uniform.vector2);
          break;
        case UniformType.VECTOR3:
          gl.uniform3fv(uniform.location, uniform.vector3);
          break;
        case UniformType.VECTOR4:
          gl.uniform4fv(uniform.location, uniform.vector4);
          break;
        case UniformType.TEXTURE:
          gl.uniform1i(uniform.location, uniform.textureIndex);
          gl.activeTexture(gl['TEXTURE' + uniform.textureIndex]);
          gl.bindTexture(gl.TEXTURE_2D, uniform.texture);
          break;
        default:
          break;
      }
    }
  }

  public getUniform(uniformName:string):ShaderUniform
  {
    const length:number = this._uniformList.length;
    for(let i:number = 0; i < length; i++)
    {
      const uniform:ShaderUniform = this._uniformList[i];
      if(uniform.name === uniformName)
      {
        return uniform;
      }
    }
    return null;
  }

  public getUniformBufferObject(uniformName:string):UniformBufferObject
  {
    const length:number = this._uniformBufferObjectList.length;
    for(let i:number = 0; i < length; i++)
    {
      const uniform:UniformBufferObject = this._uniformBufferObjectList[i];
      if(uniform.name === uniformName)
      {
        return uniform;
      }
    }
    return null;
  }
}

export interface ShaderAttribute
{
  name:string;
  stride:number;
  location:number;
}

export interface ShaderUniform
{
  type:UniformType;
  name:string;
  location:WebGLUniformLocation;
  float?:number;
  vector2?:vec2;
  vector3?:vec3;
  vector4?:vec4;
  matrix4?:mat4;
  texture?:WebGLTexture;
  textureIndex?:number;
}

export declare const enum UniformType
{
  'FLOAT',
  'VECTOR2',
  'VECTOR3',
  'VECTOR4',
  'MATRIX4',
  'TEXTURE'
}
