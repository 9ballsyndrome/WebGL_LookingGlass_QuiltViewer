/*!
 * Copyright 2017-2019 Looking Glass Factory Inc.
 * All rights reserved.
 *
 * This algorithm thanks to HoloPlay.js by Looking Glass Factory Inc
 * refer to: https://lookingglassfactory.com/downloads/three-js-library-looking-glass/
 */

import {ProgramObject, ShaderUniform, UniformType} from '../webgl/ProgramObject';
import {RenderQuiltProgramUniform} from './RenderQuiltProgramUniform';

export class RenderQuiltProgram extends ProgramObject
{
  public get shaderUniform():RenderQuiltProgramUniform
  {
    return this._uniformBufferObjectList[0] as RenderQuiltProgramUniform;
  }

  public get mvpMatrix():ShaderUniform
  {
    return this.uniformList[0];
  }

  public get quiltTexture():ShaderUniform
  {
    return this.uniformList[1];
  }

  protected init():void
  {
    // language=GLSL
    this._vertexShaderSource = `#version 300 es

      in vec3 position;
      in vec2 uv;
      
      uniform mat4 mvpMatrix;
      
      out vec2 iUv;
      
      void main(void)
      {
        iUv = uv;
        gl_Position = mvpMatrix * vec4(position, 1.0);
      }
    `;

    // language=GLSL
    this._fragmentShaderSource = `#version 300 es
      precision mediump float;
      
      in vec2 iUv;
      
      uniform sampler2D quiltTexture;
      
      layout (std140) uniform Uniforms {
        float pitch;
        float tilt;
        float center;
        float invView;
        
        vec2 flip;
        vec2 tiles;
        
        float subp;
        // float padding1;
        // float padding2;
        // float padding3;
      } uniforms;
      
      out vec4 outColor;
      
      vec2 texArr(vec3 uvz)
      {
        float z = floor(uvz.z * uniforms.tiles.x * uniforms.tiles.y);
        float x = (mod(z, uniforms.tiles.x) + uvz.x) / uniforms.tiles.x;
        float y = (floor(z / uniforms.tiles.x) + uvz.y) / uniforms.tiles.y;
        return vec2(x, y);
      }
      
      void main(void)
      {
        vec4 rgb[3];
        
        // Flip UVs if necessary
        vec3 nuv = vec3((vec2(1.0) - uniforms.flip) * iUv + uniforms.flip * (vec2(1.0) - iUv), 0.0);
        
        for (int i = 0; i < 3; i++)
        {
          nuv.z = (iUv.x + float(i) * uniforms.subp + iUv.y * uniforms.tilt) * uniforms.pitch - uniforms.center;
          nuv.z = mod(nuv.z + ceil(abs(nuv.z)), 1.0);
          nuv.z = (1.0 - uniforms.invView) * nuv.z + uniforms.invView * (1.0 - nuv.z);
          rgb[i] = texture(quiltTexture, texArr(vec3(iUv.x, iUv.y, nuv.z)));
        }
        
        outColor = vec4(rgb[0].r, rgb[1].g, rgb[2].b, 1.0);
      }
    `;

    this._uniformBufferObjectList[0] = new RenderQuiltProgramUniform('Uniforms', 0);

    this.attributeList[0] = {
      name:'position',
      stride:3,
      location:-1
    };

    this.attributeList[1] = {
      name:'uv',
      stride:2,
      location:-1
    };

    this.uniformList[0] = {
      name:'mvpMatrix',
      type:UniformType.MATRIX4,
      location:null,
      vector4:null
    };

    this.uniformList[1] = {
      name:'quiltTexture',
      type:UniformType.TEXTURE,
      location:null,
      texture:null,
      textureIndex:0
    };
  }
}