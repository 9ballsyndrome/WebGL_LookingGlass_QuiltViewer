/*!
 * Copyright 2017-2019 Looking Glass Factory Inc.
 * All rights reserved.
 *
 * This algorithm thanks to HoloPlay.js by Looking Glass Factory Inc
 * refer to: https://lookingglassfactory.com/downloads/three-js-library-looking-glass/
 */

import {OrthoScreenObject} from '../webgl/OrthoScreenObject';
import {RenderQuiltProgram} from './RenderQuiltProgram';
import {RenderQuiltProgramUniform} from './RenderQuiltProgramUniform';

export class HoloPlay
{
  private static readonly WEBSOCKET_URL:string = 'ws://localhost:11222/';

  private static readonly LKG_DEFAULT_CALIBRATION:LKGCalibration = {
    configVersion:'1.0',
    serial:'00112',
    pitch:{value:49.825218200683597},
    slope:{value:5.2160325050354},
    center:{value:-0.23396748304367066},
    viewCone:{value:40.0},
    invView:{value:1.0},
    verticalAngle:{value:0.0},
    DPI:{value:338.0},
    screenW:{value:2560.0},
    screenH:{value:1600.0},
    flipImageX:{value:0.0},
    flipImageY:{value:0.0},
    flipSubp:{value:0.0}
  };

  private calibration:LKGCalibration;

  private orthoScreen:OrthoScreenObject;
  private quiltProgram:RenderQuiltProgram;
  private isUniformDirty:boolean;

  constructor()
  {
  }

  public creatProgram(gl2:WebGL2RenderingContext):void
  {
    this.orthoScreen = new OrthoScreenObject();
    this.orthoScreen.createBuffer(gl2);

    this.quiltProgram = new RenderQuiltProgram();
    this.quiltProgram.creatProgram(gl2);
    this.quiltProgram.shaderUniform.createBuffer(gl2);
    this.quiltProgram.mvpMatrix.matrix4 = this.orthoScreen.screenMatrix;

    this.isUniformDirty = false;
  }

  public async initCalibration():Promise<void>
  {
    return new Promise((resolve) =>
    {
      let osName:OSType = OSType.Unknown;
      const appVersion:string = navigator.appVersion;
      if(appVersion.indexOf('Win') !== -1)
      {
        osName = OSType.Windows;
      }
      else if(appVersion.indexOf('Mac') !== -1)
      {
        osName = OSType.MacOS;
      }
      else if(appVersion.indexOf('X11') !== -1)
      {
        osName = OSType.UNIX;
      }
      else if(appVersion.indexOf('Linux') !== -1)
      {
        osName = OSType.Linux;
      }

      const ws:WebSocket = new WebSocket(HoloPlay.WEBSOCKET_URL);

      const timeout:number = setTimeout(() =>
      {
        console.log('Calibration not found.');
        ws.close();
        this.setCalibration(null);
        resolve();
      }, 800);
      ws.onmessage = (event:MessageEvent) =>
      {
        clearTimeout(timeout);
        ws.close();
        this.setCalibration(event.data);
        resolve();
      };
      ws.onerror = (event:Event) =>
      {
        if(confirm('Three.js driver not detected! Click OK to download. If you have already installed the driver, please make sure port 11222 is open.'))
        {
          if(osName === OSType.Windows)
          {
            window.location.href = 'https://s3.amazonaws.com/static-files.lookingglassfactory.com/WebCalibrationBridge/LKG_ThreeJsDriver_Win.exe';
          }
          else if(osName === OSType.MacOS)
          {
            window.location.href = 'https://s3.amazonaws.com/static-files.lookingglassfactory.com/WebCalibrationBridge/LKG_ThreeJsDriver_Mac.pkg';
          }
          else
          {
            alert('Only Windows and OSX operating systems are currently supported for the Browser LKG.');
          }
        }
        clearTimeout(timeout);
        ws.close();
        this.setCalibration(null);
        resolve();
      };
    });
  }

  private setCalibration(calibrationStr:string):void
  {
    let calibration:LKGCalibration;
    const errorMessage:string = 'No Looking Glass display connected; using default calibration data. Please ensure your Looking Glass is connected to your computer via USB and reload the page.';
    if(calibrationStr)
    {
      try
      {
        calibration = JSON.parse(calibrationStr);
        console.log('New calibration loaded.');
      } catch(e)
      {
        console.log(errorMessage);
        calibration = HoloPlay.LKG_DEFAULT_CALIBRATION;
      }
    }
    else
    {
      console.log(errorMessage);
      calibration = HoloPlay.LKG_DEFAULT_CALIBRATION;
    }
    console.log(calibration);
    this.calibration = calibration;
    this.setShaderValues();

    window.addEventListener('resize', () =>
    {
      this.setShaderValues();
    });
  }

  private setShaderValues():void
  {
    const uniform:RenderQuiltProgramUniform = this.quiltProgram.shaderUniform;

    const dpi:number = this.calibration.DPI.value;
    const pitch:number = this.calibration.pitch.value;
    const slope:number = this.calibration.slope.value;
    const screenH:number = this.calibration.screenH.value;
    const screenW:number = this.calibration.screenW.value;
    const center:number = this.calibration.center.value;
    const flipX:number = this.calibration.flipImageX.value;
    const flipY:number = this.calibration.flipImageY.value;
    const invView:number = this.calibration.invView.value;

    //  const screenInches:number = screenW / dpi;
    const screenInches:number = window.innerWidth / dpi;
    let newPitch:number = pitch * screenInches;

    // account for tilt in measuring pitch horizontally
    newPitch *= Math.cos(Math.atan(1.0 / slope));
    uniform.pitch = newPitch;

    // tilt
    let newTilt:number = window.innerHeight / (window.innerWidth * slope);
    if(flipX === 1)
    {
      newTilt *= -1;
    }
    uniform.tilt = newTilt;

    // center
    // I need the relationship between the amount of pixels I have moved over to the amount of lenticulars I have jumped
    // ie how many pixels are there to a lenticular?
    uniform.center = center;

    // should we invert?
    uniform.invView = invView;

    // Should we flip it for peppers?
    uniform.flip = new Float32Array([flipX, flipY]);

    uniform.subp = 1 / (screenW * 3);

    // tiles
    // uniform.tiles = new Float32Array([this.tilesX, this.tilesY]);

    this.isUniformDirty = true;
  }

  public setTexture(texture:WebGLTexture, tilesX:number, tilesY:number):void
  {
    this.quiltProgram.quiltTexture.texture = texture;
    this.quiltProgram.shaderUniform.tiles = new Float32Array([tilesX, tilesY]);

    this.isUniformDirty = true;
  }

  public renderView(gl2:WebGL2RenderingContext):void
  {
    if(this.isUniformDirty)
    {
      this.quiltProgram.shaderUniform.updateBuffer(gl2);
    }
    gl2.bindFramebuffer(gl2.FRAMEBUFFER, null);
    gl2.viewport(0, 0, window.innerWidth, window.innerHeight);
    gl2.clear(gl2.COLOR_BUFFER_BIT | gl2.DEPTH_BUFFER_BIT);

    this.orthoScreen.bindBuffer(gl2, this.quiltProgram);
    this.quiltProgram.bindShader(gl2);
    gl2.drawElements(gl2.TRIANGLES, this.orthoScreen.numIndices, gl2.UNSIGNED_SHORT, 0);
  }
}

declare const enum OSType
{
  'Unknown',
  'Windows',
  'MacOS',
  'UNIX',
  'Linux'
}

declare interface LKGCalibrationValue
{
  value:number;
}

declare interface LKGCalibration
{
  configVersion:string;
  serial:string;
  pitch:LKGCalibrationValue;
  slope:LKGCalibrationValue;
  center:LKGCalibrationValue;
  viewCone:LKGCalibrationValue;
  invView:LKGCalibrationValue;
  verticalAngle:LKGCalibrationValue;
  DPI:LKGCalibrationValue;
  screenW:LKGCalibrationValue;
  screenH:LKGCalibrationValue;
  flipImageX:LKGCalibrationValue;
  flipImageY:LKGCalibrationValue;
  flipSubp:LKGCalibrationValue;
}
