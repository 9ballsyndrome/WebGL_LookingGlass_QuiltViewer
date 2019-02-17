import EventEmitter = NodeJS.EventEmitter;

interface Controller extends EventEmitter
{
  connect():Controller;
}

interface Frame
{
  hands:Hand[];
}

interface Hand
{
  fingers:Finger[];
}

interface Finger extends Pointable
{
}

interface Pointable
{
  tipPosition:number[];
}