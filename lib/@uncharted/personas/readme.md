# Personas
  
A Javascript UI component for visualizing clusters and groups 

## Getting Started
  
### Prerequisites
- Node.js v4.2.2 or higher  
- Docker & Docker Tools are supported but **optional**  
  
### Setup

1. Create a new folder for the Personas source code:  
  
    `mkdir ~/projects/personas`  

2. Clone the Personas repository into the folder created in step 1:  
  
    `cd ~/project/personas`  
    `git clone https://stash.uncharted.software/scm/stories/personas.git`  

3. **[Optional]** Give the `personas.sh` shell script execution priviledges:  
  
    `chmod +x personas.sh`  

4. Build and run the personas project:  
  
    `./personas.sh --all`  
	or
	`sh ./personas.sh --all`  

5. Verify that the demo page displays correctly by naigating to `http://localhost:8081` in your browser.  
6. **[Optional]** If Docker is installed, you can dockerize the project with the following command:  
 
    `./personas.sh -d -a`  

7. **[Optional]** Verify that the Docker application is working correctly by navigating to the url specified in the console window.  

### Data format  

The data that personas will display should be in structured as follows:  
  
    {
        "entityRefs": { // Reference ids linking the entity information provided here with personas.
            "ANIMAL_1": { // Object containing information about the entity, it must be defined by its id.
                "id": "ANIMAL_1", // Id of the entity, must be the same as the key defining this object.
                "name": "Smokey", // Name of the entity
                "type": "animal", // Type of the entity 
                "imageUrl": ["./images/cat1.jpg"] // URL of an image of the entity, an array can be passed to draw multiple images on the persona.
            }
        },
        "aggregates": {
            "personas": { // Personas to be displayed
                "0": { // A persona object, must be defined by its id.
                    "id": "0", // Id of the persona, must be the same as the key defining this object.
                    "properties": [ // Array of properties for this persona.
                        {
                            "entityRefId": "ANIMAL_1", // Reference id of te entity thi property represents.
                            "count": 37, // Count, out of the total count of this hits for this persona, that this property represents.
                            "isPrimary": true, // Is this the primary/owner property of this persona. If det to `true`, the information in this property and its linked entity will be displayed on the persona.
                            "color": null // OPTIONAL. Color to use for this property in the case that no other color can be found.
                        }
                    ],
                    "imageUrl": null, // If no `entityRefs` object is present an image URL can be set here to represent the property; an array can be passed to draw multiple images on the persona.
                    "totalCount": 111 // The total hit count for this persona.
                }
            },
            "links": { // Seed personas, or personas that have the potential to become personas.
                "10": { // The id of this seed persona, must be the same as the id within the object.
                    "id":"10", // Id of the seed persona, must be the same as the key used to define this object.
                    "relatedTo": "1", // Id of the persona this seed persona is related to.
                    "properties": [{ // Properties of this seed persona.
                        "entityRefId": "SOMETHING_0", // Reference id of te entity thi property represents.
                        "count": 2 // Count that this property represents.
                    }]
                }
            }
        }
    }
    
  
## Usage  
### Direct instantiation
  
To instantiate `Personas` directly first create, position and size a DOM element which will contain the module. The container element can either be `<div>` or `<svg>`.  

Instantiate `Personas` as follows:

    require('uncharted.personas.dependencies.js');
    var Personas = require('uncharted.personas.js');
    /**
     * @param { HTMLElement } element - SVG element where the personas will be drawn.
     * @param { Object | null } options - Optional configuration parameters contained in an object.
     */
    var personas = new Personas(element, options);
  
And then load the data:  
  
    /**
     * Loads the passed data into the widget and creates the personas needed to represent such data.
     *
     * @method loadData
     * @param {Object} data - The data to load.
     * @param {Boolean} append = Flag used to describe if the new data should replace or update and append itself to the old data.
     */
    personas.loadData(data, false);
  
If the `append` parameter us set to `true` and data has been loaded already, the new data will be merged with the old data and the module will be updated to reflect the changes resulting from merging the data.

### As jQuery Plugin
  
Load the personas scripts in your document's head:  
  
    <head>
        <script type="text/javascript" src="uncharted.personas.dependencies.js"></script>
        <script type="text/javascript" src="uncharted.personas.js"></script>
    </head>
  
Then create an element where to display `Personas` in your document's body:  
  
    <svg id="personas-panel" width="100%" height="600" version="1.1"  xmlns="http://www.w3.org/2000/svg"></svg>
  
Finally, load `Personas` as a jQuery plugin:  
  
    <script type="text/javascript">
        $(function() {
            var data = /* data in the specified format */
            var options = /* options for the personas module */
            
            /* initialize `Personas` plugin */
            Uncharted.Personas.asJQueryPlugin();
            
            /* instantiate `Personas` into its container */
            $("#personas-panel").personas(options);
            
            /* load the data into `Personas` */
            $("#personas-panel").personas("loaddata", data);
        });
    </script>
  
## Options
  
The options passed to `Personas` should look like this:  
  
    {
        hooks: { // OPTIONAL. Object containing callback functions to be invoked when different events happen at runtime.
            onSelectPersona: null, // Invoked when the user clicks on a persona effectively selecting or deselcting it, this callback is also invoked when the user deselects all personas by clicking on an empty space.  
            onHoverPersona: null, // Invoked when the places the mouse pointer on top of a persona.
            onMergePersona: null, // Invoked if merging personas is enabled and the user drags a persona on top of another completing a merge between them.
        },
        autoGenerateIconMap: false, // Should the `entityIcons` be auto generated, if set to `false` the `entityIcons` field must be present.
        entityIcons: [ // OPTIONAL. Array containing information about entities within the clusters which a personas represent.
            {
                "type": "animal", // Type of entity. what is it.
                "class": "fa fa-square",
                "color": "#400000", // Overall color of this entity.
                "entityRefId": "ANIMAL_1", // The id by which this entity will be referenced.
                "name": "Lola" // Name of the entity
            },
            { // Special `default` entries can be created as follows:
                "type": "animal", // Type of the entity this default represents.
                "color": "#d26502", // Overall color of the entities of this type
                "isDefault": true // Must be set to `true`
            } // Default entries are used in the case that an entity of the specified `type` appears in the data to be displayed but it cannot be linked to an entity through its `entityRefId`
        ],
        Persona: {
            layout: {
                textpadding: 2, // Text padding used in a persona's label.
                progressHeight: 8, // The height of the gauge bars above a persona; must be in sync with the value defined in the CSS style.
                minSize: 130, // Minimum size (diameter) in pixels of a persona.
                maxSize: 250, // Maximum size (diameter) in pixels of a persona. 
                selectedBorder: 8 // Size of the border displayed when a persona is selected; must be in sync with the value defined in the CSS style.
            },
            pie: { // Options used to render the gauges around personas.
                baseColor: '#F6F1EE', // Background color
                defaultColor: '#9EC731', // If no information about the entity can be found in the `entityIcons` and no default is set for the entity type, this color will be used.
                minimumDisplayRatio: 0.025 // To avoid drawing too many gauge bars in personas with too many properties, use this value as a threshold to only draw properties which percentage value is higher than this.
            },
            config: {
                animationsDurationBase: 100, // The base duration for animations in milliseconds, not all animations will have this duration this number is used as a suggestion. 
                moveEnabled: false, // Should users be able to change the position of personas by dragging them
                mergeEnabled: true, // Should users be able to merge personas by dragging one on top of another
                mergeOverlapRatio: 0.3, // How much should two personas overlap for it to be considered as a merge attempt
                mergeScaleRatio: 1.05, // When personas are merged how much should the receiving persona grow
                drawOrbits: true, // Should orbits where personas are placed drawn
                seedAnimationDurationBase: 400, // Seed personas animation duration in milliseconds. This is considered a suggestion.
                autoGenerateFallbackColors: true, // Should colors be generated for personas and their properties if the data is missing color information.
                autoColorClampMin: 40, // If colors are automatically generated what's the minimum value per channel that they should have (0 - 255)
                autoColorClampMax: 220, // If colors are automatically generated what's the maximum value per channel that they should have (0 - 255)
                fallbackBackgroundColor: '#444444' // If colors should not be automatically generated, what should the default background color for personas be.
            }
        }
    }
  

## Troubleshooting / FAQ  
**Q:** How is `Personas` rendered to the screen?    
**A:** `Personas` is implemented to run in SVG using the Snap.svg library.  
  
**Q:** I am getting errors when loading data, how can I fix it?  
**A:** Some frameworks construct the page layout off screen; because some of the SVG methods used in `Personas` require
that they are added to the DOM and be visible, please make sure that your framework has completely created the document
and added it to the DOM before loading data into `Personas`.  *NOTE:* Instantiation of `Personas` can be done at any point
in time, if you are having issues instantiating `Personas` please contact us.  

