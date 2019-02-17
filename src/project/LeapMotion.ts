import 'leapjs/leap-0.6.4';

declare const Leap:any;

export class LeapMotion extends EventTarget
{
  private controller:Controller;

  private deviceConnected:boolean = false;

  private oldTipX:number = 0.0;
  private oldTipY:number = 0.0;
  private oldTipZ:number = 0.0;
  private tipStableCount:number = 0;
  private swipeFrameCount:number = 0;
  private swipeTipDx:number[] = [];
  private isCoolTime:boolean = false;

  constructor()
  {
    super();
    this.controller = new Leap.Controller();
    this.controller.on('frame', (frame:Frame) => this.onFrame(frame));
    this.controller.connect();
  }

  public onFrame(frame:Frame):void
  {
    if(!this.isCoolTime)
    {
      const hands:Hand[] = frame.hands;
      if(hands.length === 1)
      {
        const hand:Hand = hands[0];

        const tipPosition:number[] = hand.fingers[1].tipPosition;
        const dx:number = tipPosition[0] - this.oldTipX;
        const dy:number = tipPosition[1] - this.oldTipY;
        const dz:number = tipPosition[2] - this.oldTipZ;
        if(dx * dx + dy * dy + dz * dz < 150)
        {
          this.tipStableCount += 1;
        }
        else
        {
          this.tipStableCount = 0;
        }

        if(this.tipStableCount > 5)
        {
          this.swipeFrameCount = 5;
        }
        else
        {
          this.swipeFrameCount -= 1;
        }

        if(this.swipeFrameCount > 0)
        {
          this.swipeTipDx.push(dx);
          let length:number = this.swipeTipDx.length;
          if(length === 6)
          {
            this.swipeTipDx.shift();
            length = 5;
          }

          let sumDx:number = 0;
          for(let i:number = 0; i < length; i++)
          {
            sumDx += this.swipeTipDx[i];
          }

          let isSwiped:boolean = false;
          if(sumDx > 50)
          {
            this.dispatchEvent(new Event('leapRight'));
            isSwiped = true;
          }
          else if(sumDx < -50)
          {
            this.dispatchEvent(new Event('leapLeft'));
            isSwiped = true;
          }

          if(isSwiped)
          {
            this.resetValue();
            this.isCoolTime = true;
            setTimeout(() =>
            {
              this.isCoolTime = false;
            }, 700);
          }
        }
        else
        {
          this.swipeTipDx = [];
        }

        this.oldTipX = tipPosition[0];
        this.oldTipY = tipPosition[1];
        this.oldTipZ = tipPosition[2];
      }
    }
  }

  private resetValue():void
  {
    this.oldTipX = 0.0;
    this.oldTipY = 0.0;
    this.oldTipZ = 0.0;
    this.tipStableCount = 0;
    this.swipeFrameCount = 0;
    this.swipeTipDx = [];
  }
}
