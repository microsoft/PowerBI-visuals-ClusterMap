#stories.common
  
***  

##Overview  
This repository holds common classes and methods used throughout the `Stories` project. It was extracted onto its own
repository because, although the methods here were designed for `Stories`, the methods are generic enough to be used in
projects other than `Stories`

##Getting Started  
#### Prerequisites
- Node.js v4.2.2 or higher  
  
#### Setup
1. Create a new folder for the `stories.common` source code:  
  
    `mkdir ~/projects/stories.common`

2. Clone the Personas repository into the folder created in step 1:  
  
    `cd ~/project/stories.common`  
    `git clone https://stash.uncharted.software/scm/stories/stories.common.git`

3. **[Optional]** Give the `stories.common.sh` shell script execution priviledges:  
  
    chmod +x stories.common.sh

4. Build the stories.common project:  
  
    `./stories.common.sh --all`  
	or  
	`sh ./personas.sh --all` 
  
##Usage  
Below you can find the different tools included in the `stories.common` project.  

####uncharted.infiniteScroll  
Used to create content views that can scroll infinitely:  
  
    /**
     * @param {Element} scrollableViewport - The DOM element which will become scrollable infinitely
     * @param {Number} distanceFromBottom - Distance grom the bottom of the scroll at which loading more content will be triggered.
     */
    var infiniteScroll = new InfiniteScroll(scrollableViewport, distanceFromBottom);
  
####uncharted.keyboard
Simple keyboard wrapper to be attached to DOM elements:  
  
    /**
     * @param {Element} elem - The DOM element to attach this instance to.
     * @param {Object=} options - An object containing the options for this instance.
     */
    var keyboard = new UnchartedKeyboard(elem, options);
  
**uncharted.keyboard: OPTIONS**  
  
    {
        repeatDelay: 100 // The delay, in milliseconds, in which a key press will be repeated while held pressed.
    }
  
####uncharted.mediator  
Mediator interface wrapper. Useful when using different mediator backends:  
  
    /**
     * @param {*} m - The original mediator class to wrap.
     */
    var mediator = new UnchartedMediator(m);
  
####uncharted.mousehold  
Utility to detect when the mouse click is held on top of an object:  
  
    /**
     * @param {Element} $element - A jQuery-wrapped element to observe for mouse events.
     */
    var mouseHold = new MouseHold($element);
  
####uncharted.pan
Simple helper class to pan an SVG element around using the mouse.  
Uses a group as a viewport to perform the transformations:  
  
    /**
     * @param {SVGElement} targetSvg - The svg element where the viewport resides.
     * @param {Snap.group} viewport - A group within the svg element where the pan transformations should be performed.
     */
    var pan = new Pan(targetSvg, viewport);
  
#### uncharted.scrollable  
Utility to highlight the location within the scrollable container where the user is at while scrolling through the content.
  
    /**
     * @param {Element} $container - A jQuery-wrapped element.
     * @param {Object} options - An object containing the options for this instance.
     */
    var scrollable = new Scrollable($container, options);
  
**uncharted.scrollable: OPTIONS**  
  
    {
        viewportSelector: '.someClass', // A selector string identifying the viewport element.
        sliderSelector: '.someOtherClass' // A selector string identifying the slider used for the viewport.
    }
  
####uncharted.zoom  
Simple class to "zoom" in and out of an SVG element. Uses a group as a viewport to perform the transformations.  
*WARNING:* This class does not take into consideration the possibility of transformations being applied to the viewport outside of this class. Unexpected behaviour may occur.  
  
    /*
     * @param {SVGElement} targetSvg - The svg element where the viewport resides.
     * @param {Snap.group} viewport - A group within the svg element where the zoom transformations should be performed.
     * @param {Object} options - Object containing the options used to control the zoom.
     */
    var zoom = new Zoom(targetSvg, viewport, options);
  
**uncharted.zoom: OPTIONS**  
  
    {
        minScale: 0.5, // The minimum scale that this instance will use when scaling down the viewport.
        maxScale: 2, // The maximum scale that this instance will use when scaling up the viewport.
        step: 0.001, // How much the scale of the viewport should increase/decrease per mouse wheel "click"
    }
  
##Troubleshooting / FAQ  
    
  
##Contact  
Main Contact: *TBD*  
Technical Manager: Isaac Wong <iwong@uncharted.software>  
Development Support: Jaehwan Ryu <jryu@uncharted.software>  
Development Support: Dario Segura <dsegura@uncharted.software>  
  
## License  
*TBD*  

