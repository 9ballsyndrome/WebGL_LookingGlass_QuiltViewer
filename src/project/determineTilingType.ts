/*!
 * Utility function to determine the division number of given quilt image using autocorrelation
 *
 * This algorithm thanks to LookingGlassQuiltViewer by kirurobo
 * refer to: https://github.com/kirurobo/LookingGlassQuiltViewer
 */

const QUILT_PRESET_LIST:QuiltPreset[] = [
  {
    name:'Standard',
    width:2048,
    height:2048,
    tilesX:4,
    tilesY:8
  },
  {
    name:'High Res',
    width:4096,
    height:4096,
    tilesX:5,
    tilesY:9
  },
  {
    name:'High View',
    width:4096,
    height:4096,
    tilesX:6,
    tilesY:10
  },
  {
    name:'Extra Low',
    width:1600,
    height:1600,
    tilesX:4,
    tilesY:6
  }
];

const canvas2D:HTMLCanvasElement = document.createElement('canvas');
const context2D:CanvasRenderingContext2D = canvas2D.getContext('2d');

export function determineTilingType(image:HTMLImageElement):{tilesX:number, tilesY:number}
{
  const canditateList:QuiltPreset[] = [];
  for(let i:number = 0; i < QUILT_PRESET_LIST.length; i++)
  {
    const preset:QuiltPreset = QUILT_PRESET_LIST[i];
    if(preset.height === image.height && preset.width === image.width)
    {
      // 画像サイズがプリセットのサイズと一致すれば候補とする
      canditateList.push(preset);
    }
    else
    {
      // サイズが一致しなければ、そのtileX,tileYでサイズを合わせた候補を作成
      canditateList.push(
        {
          name:'Custom ' + preset.tilesX + 'x' + preset.tilesY,
          tilesX:preset.tilesX,
          tilesY:preset.tilesY,
          width:image.width,
          height:image.height
        });
    }
  }

  // どれも候補に残らなければ初期指定のTilingにしておく
  if(!canditateList.length)
  {
    return {
      tilesX:QUILT_PRESET_LIST[0].tilesX,
      tilesY:QUILT_PRESET_LIST[0].tilesY
    };
  }

  // テクスチャを配列に取得
  canvas2D.width = image.width;
  canvas2D.height = image.height;
  context2D.drawImage(image, 0, 0);
  const pixelData:Uint8ClampedArray = context2D.getImageData(0, 0, image.width, image.height).data;

  // Tiling候補ごとの自己相関を求める
  const score:number[] = [];

  // 相関をとる周期の調整値。1だと全ピクセルについて相関をとるが遅い。
  const skip:number = Math.max(image.width >> 9, 1);

  for(let i:number = 0; i < canditateList.length; i++)
  {
    const preset:QuiltPreset = canditateList[i];
    const tileSizeX:number = (preset.width / preset.tilesX) << 0;
    const tileSizeY:number = (preset.height / preset.tilesY) << 0;
    const numViews:number = preset.tilesX * preset.tilesY;
    score[i] = 0;
    for(let v:number = 0; v < tileSizeY; v += skip)
    {
      for(let u:number = 0; u < tileSizeX; u += skip)
      {
        // 中央タイルの画素を平均値の代わりに利用する
        //   （各タイル間ではわずかな違いしかないという前提）
        const centerTileX:number = preset.tilesX >> 1;
        const centerTileY:number = preset.tilesY >> 1;
        const pixel:number = (centerTileY * tileSizeY + v) * image.width + (centerTileX * tileSizeX + u);
        // 輝度を計算
        const averageL:number = 0.299 * pixelData[pixel * 4] + 0.587 * pixelData[pixel * 4 + 1] + 0.114 * pixelData[pixel * 4 + 2];

        let variance:number = 0.0;
        for(let y:number = 0; y < preset.tilesY; y++)
        {
          for(let x:number = 0; x < preset.tilesX; x++)
          {
            const pixel:number = (y * tileSizeY + v) * image.width + (x * tileSizeX + u);
            // 輝度の差分を計算
            const diffL:number = (0.299 * pixelData[pixel * 4] + 0.587 * pixelData[pixel * 4 + 1] + 0.114 * pixelData[pixel * 4 + 2]) - averageL;
            variance += diffL * diffL;
          }
        }
        score[i] += variance;
      }
    }
  }

  // 最も相関が高かったプリセットを選択
  let selectedIndex:number = 0;
  let minScore:number = Number.MAX_VALUE;
  for(let i:number = 0; i < canditateList.length; i++)
  {
    // console.log(canditateList[i].name + ' : ' + score[i]);

    if(minScore > score[i])
    {
      selectedIndex = i;
      minScore = score[i];
    }
  }

  const quiltConfig:QuiltPreset = canditateList[selectedIndex];
  // console.log(quiltConfig.name, quiltConfig.tilesX, quiltConfig.tilesY);

  return {
    tilesX:quiltConfig.tilesX,
    tilesY:quiltConfig.tilesY
  };
}

declare interface QuiltPreset
{
  name:string;
  width:number;
  height:number;
  tilesX:number;
  tilesY:number;
}