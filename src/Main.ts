import {determineTilingType} from './project/determineTilingType';
import {HoloPlay} from './project/HoloPlay';

export class Main
{
  private canvas:HTMLCanvasElement;
  private context:WebGL2RenderingContext;

  private textureList:QuiltTexture[];
  private currentTextureIndex:number;

  private holoplay:HoloPlay;
  private holoplayGamepad:HoloplayGamepadState;

  constructor()
  {
    console.log(new Date());
    this.init();
  }

  private async init():Promise<void>
  {
    // Canvas setup
    const canvas:HTMLCanvasElement = document.getElementById(('myCanvas')) as HTMLCanvasElement;
    this.canvas = canvas;

    // Create WebGL2RenderingContext
    const context:WebGL2RenderingContext = canvas.getContext('webgl2') as WebGL2RenderingContext;
    if(!context)
    {
      document.body.className = 'error';
      return;
    }
    context.clearColor(0.2, 0.2, 0.2, 1.0);
    context.enable(context.CULL_FACE);
    context.pixelStorei(context.UNPACK_FLIP_Y_WEBGL, 1);
    this.context = context;

    this.holoplay = new HoloPlay();
    this.holoplay.creatProgram(context);
    await this.holoplay.initCalibration();

    this.textureList = [];
    this.currentTextureIndex = -1;

    window.addEventListener('resize', () => this.onRresize());
    this.onRresize();
    this.setupFullScreen();

    document.addEventListener('dragover', (event) => this.handleDragOver(event));
    document.addEventListener('drop', (event) => this.handleFileSelect(event));

    document.addEventListener('keydown', (event) => this.onKeydown(event));

    this.holoplayGamepad = {
      index:-1,
      square:false,
      left:false,
      right:false,
      circle:false
    };
    window.addEventListener('gamepadconnected', (event:GamepadEvent) => this.gamepadHandler(event, true));
    window.addEventListener('gamepaddisconnected', (event:GamepadEvent) => this.gamepadHandler(event, false));

    context.clear(context.COLOR_BUFFER_BIT);
  }

  private render():void
  {
    if(this.textureList.length)
    {
      // render
      this.holoplay.renderView(this.context);
    }
  }

  private onRresize():void
  {
    const width:number = window.innerWidth;
    const height:number = window.innerHeight;
    this.canvas.width = width;
    this.canvas.height = height;

    this.render();
  }

  private setupFullScreen():void
  {
    const newHTML:string =
      '<input type="button" style="margin:20px; position:fixed; top:0px; right:0px; z-index: 10000; height:50px; width:150px;" id="fullscreenButton" value="Enter Full Screen Mode"/>';

    const buttonDiv:HTMLDivElement = document.createElement('div');
    buttonDiv.innerHTML = newHTML;
    buttonDiv.setAttribute('id', 'fullscreen');
    document.body.appendChild(buttonDiv);

    document.getElementById('fullscreen').addEventListener('click', () =>
    {
      if(this.canvas.requestFullscreen)
      {
        this.canvas.requestFullscreen();
      }
    });
  }

  private async handleFileSelect(event:DragEvent):Promise<void>
  {
    event.stopPropagation();
    event.preventDefault();

    const oldLength:number = this.textureList.length;

    const items:DataTransferItemList = event.dataTransfer.items;
    if(items.length && items[0].webkitGetAsEntry)
    {
      const entries:any[] = [];
      for(let i:number = 0; i < items.length; i++)
      {
        // get entry by webkitGetAsEntry() first because DataTransferItem will be lost in await function.
        entries[i] = items[i].webkitGetAsEntry();
      }

      for(let i:number = 0; i < entries.length; i++)
      {
        await this.traverseEntry(this.textureList, entries[i]);
      }
    }
    else
    {
      for(let i:number = 0; i < items.length; i++)
      {
        this.addFile(this.textureList, items[i].getAsFile());
      }
    }

    if(this.textureList.length > oldLength)
    {
      this.currentTextureIndex = oldLength;
      await this.setTexture();

      this.render();

      document.getElementById('howtouse').style.display = 'none';
    }
  }

  private async traverseEntry(list:QuiltTexture[], entry:any):Promise<void>
  {
    if(entry.isFile)
    {
      await new Promise((resolve) =>
      {
        entry.file((file:any) =>
        {
          this.addFile(list, file);
          resolve();
        });
      });
    }
    else if(entry.isDirectory)
    {
      const reader:any = entry.createReader();
      await new Promise((resolve) =>
      {
        reader.readEntries(
          async(results:any) =>
          {
            for(let i:number = 0; i < results.length; i++)
            {
              await this.traverseEntry(this.textureList, results[i]);
            }
            resolve();
          },
        );
      });
    }
  }

  private addFile(list:QuiltTexture[], file:File):void
  {
    if(file.type.match(/image\/(png|jpg|jpeg)/) || (file.type === '' && file.name.match(/(png|jpg|jpeg)$/)))
    {
      list.push({
        texture:null,
        tileX:0,
        tileY:0,
        file:file
      });
    }
  }

  private async loadDataURL(file:File):Promise<string>
  {
    return new Promise((resolve) =>
    {
      const reader:FileReader = new FileReader();
      reader.onload = (event:any) =>
      {
        resolve(event.target.result);
      };
      reader.readAsDataURL(file);
    });
  }

  private async loadImage(url:string):Promise<HTMLImageElement>
  {
    return new Promise((resolve) =>
    {
      const image:HTMLImageElement = new Image();
      image.onload = () => resolve(image);
      image.src = url;
    });
  }

  private createTexture(image:HTMLImageElement):WebGLTexture
  {
    const gl:WebGLRenderingContext = this.context;
    const texture:WebGLTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);

    return texture;
  }

  private async setTexture():Promise<void>
  {
    const quiltTexture:QuiltTexture = this.textureList[this.currentTextureIndex];
    if(quiltTexture.file)
    {
      const dataURL:string = await this.loadDataURL(quiltTexture.file);
      const image:HTMLImageElement = await this.loadImage(dataURL);
      quiltTexture.texture = this.createTexture(image);

      quiltTexture.file = undefined;

      const tiles:{tilesX:number, tilesY:number} = determineTilingType(image);
      quiltTexture.tileX = tiles.tilesX;
      quiltTexture.tileY = tiles.tilesY;
    }
    this.holoplay.setTexture(quiltTexture.texture, quiltTexture.tileX, quiltTexture.tileY);
  }

  private handleDragOver(event:DragEvent):void
  {
    event.stopPropagation();
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }

  private onKeydown(event:KeyboardEvent):void
  {
    switch(event.code)
    {
      case 'ArrowUp':
      case 'ArrowLeft':
        this.changeImage(false);
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        this.changeImage(true);
        break;
      default:
        break;
    }
  }

  private async gamepadHandler(event:GamepadEvent, isConnected:boolean):Promise<void>
  {
    if(event.gamepad.id.match('HoloPlay'))
    {
      if(isConnected)
      {
        this.holoplayGamepad.index = event.gamepad.index;
        this.gamepadLoop();
      }
      else
      {
        this.holoplayGamepad.index = -1;
      }
      console.log(event.gamepad, isConnected);
    }
  }

  private gamepadLoop():void
  {
    if(this.holoplayGamepad.index !== -1)
    {
      const state:HoloplayGamepadState = this.holoplayGamepad;

      const gamepad:Gamepad = navigator.getGamepads()[this.holoplayGamepad.index];
      const square:boolean = gamepad.buttons[0].pressed;
      const left:boolean = gamepad.buttons[1].pressed;
      const right:boolean = gamepad.buttons[2].pressed;
      const circle:boolean = gamepad.buttons[3].pressed;

      if(state.square && !square)
      {
        // console.log('pressed: square');
        this.changeImage(false);
      }
      if(state.left && !left)
      {
        // console.log('pressed: left');
        this.changeImage(false);
      }
      if(state.right && !right)
      {
        // console.log('pressed: right');
        this.changeImage(true);
      }
      if(state.circle && !circle)
      {
        // console.log('pressed: circle');
        this.changeImage(true);
      }

      state.square = square;
      state.left = left;
      state.right = right;
      state.circle = circle;

      requestAnimationFrame(() => this.gamepadLoop());
    }
  }

  private async changeImage(isNext:boolean):Promise<void>
  {
    if(isNext)
    {
      if(this.textureList.length >= 2)
      {
        if(this.currentTextureIndex === this.textureList.length - 1)
        {
          this.currentTextureIndex = 0;
        }
        else
        {
          this.currentTextureIndex += 1;
        }
        await this.setTexture();

        this.render();
      }
    }
    else
    {
      if(this.textureList.length >= 2)
      {
        if(this.currentTextureIndex === 0)
        {
          this.currentTextureIndex = this.textureList.length - 1;
        }
        else
        {
          this.currentTextureIndex -= 1;
        }
        await this.setTexture();

        this.render();
      }
    }
  }
}

window.addEventListener('DOMContentLoaded', () =>
{
  new Main();
});

declare interface QuiltTexture
{
  texture:WebGLTexture;
  tileX:number;
  tileY:number;

  file?:File;
}

declare interface HoloplayGamepadState
{
  index:number;
  square:boolean;
  left:boolean;
  right:boolean;
  circle:boolean;
}