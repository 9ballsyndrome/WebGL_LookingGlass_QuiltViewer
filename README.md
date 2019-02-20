# LookingGlass QuiltViewer for Web

This repository shows [The Looking Glass](https://lookingglassfactory.com/) demo which displays quilt image using web browser(WebGL).

[![webgl-lookingglass_quiltviewer_demo.gif](https://raw.githubusercontent.com/9ballsyndrome/WebGL_LookingGlass_QuiltViewer/master/document/webgl-lookingglass_quiltviewer_demo.gif)](https://9ballsyndrome.github.io/WebGL_LookingGlass_QuiltViewer/dist/)

- [View demo (Make sure you are on a system with WebGL 2.0 enabled)](https://9ballsyndrome.github.io/WebGL_LookingGlass_QuiltViewer/dist/)

## System requirements
- [The Looking Glass](https://lookingglassfactory.com/)
- Windows/macOS
- Chrome/Firefox
- [Leap Motion](https://www.leapmotion.com/) (optional)

## How to play
Press [Enter Full Screen Mode] button on the screen.

Drag & Drop your quilt image files or folders.

### Show previous image
- [Keyboard LEFT/UP]
- [LookingGlass Button left/square]
- [Leap Motion swipe left]

### Show next image
- [Keyboard RIGHT/DOWN]
- [LookingGlass Button right/circle]
- [Leap Motion swipe right]

*To use Leap Motion, make sure you have checked the “Allow Web Apps” box in the Leap Motion Control Panel (General tab).

## Thanks
- [Three.js Library for the Looking Glass](https://lookingglassfactory.com/downloads/three-js-library-looking-glass/)  
Driver, calibration and shader code.

- [LookingGlassQuiltViewer](https://github.com/kirurobo/LookingGlassQuiltViewer)  
The algorithm to determine the division number of given quilt image.
