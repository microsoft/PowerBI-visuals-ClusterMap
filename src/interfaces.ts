export interface IPersonas {
    /**
     * Loads data into the Personas View
     */
    loadData(data:any, append:boolean);

    /**
     * Finds a persona by an id
     */
    findPersona(id:string): any;

    /**
     * Sub-select personas.
     */
    subSelectPersonas(subselect:any, keepSubSelection:boolean);

    /**
     * Enable/Disable the Sidebar
     */
    subSelectPersonasMultiGauge(subselect:any, keepSubSelection:boolean);

    /**
     * Enable/Disable image blur
     */
    enableBlur(enable:boolean);
}

export interface IPersonasData {
    /**
     * Reference ids linking the entity information provided here with personas.
     */
    entityRefs?: {
        /**
         * Object containing information about the entity, it must be defined by its id.
         */
        [id: string]: {
            /**
             * Id of the entity, must be the same as the key defining this object.
             */
            id: string;

            /**
             * Name of the entity
             */
            name: string;

            /**
             * Type of the entity
             */
                type: string;

            /**
             * URL of an image of the entity, an array can be passed to draw multiple images on the persona.
             */
            imageUrl?: Array<string>;
        }
    };

    aggregates: {
        /**
         * Personas to be displayed
         */
        personas: {
            /**
             * A persona object, must be defined by its id.
             */
            [id: string]: {
                /**
                 * Id of the persona, must be the same as the key defining this object.
                 */
                id: string;

                /**
                 * Array of properties for this persona.
                 */
                properties: Array<{
                    /**
                     * Reference id of te entity thi property represents.
                     */
                    entityRefId?: string;

                    /**
                     * Count, out of the total count of this hits for this persona, that this property represents.
                     */
                    count: number;

                    /**
                     * Is this the primary/owner property of this persona. If set to `true`, the information in this
                     * property and its linked entity will be displayed on the persona.
                     */
                    isPrimary?: boolean;

                    /**
                     * Color to use for this property in the case that no other color can be found.
                     */
                    color?: string;
                }>;

                /**
                 * If no `entityRefs` object is present an image URL can be set here to represent the property;
                 * an array can be passed to draw multiple images on the persona.
                 */
                imageUrl?: Array<string>;

                /**
                 * The total hit count for this persona.
                 */
                totalCount: number;
                selection?: any;
            }
        };
        /**
         * Seed personas, or personas that have the potential to become personas.
         */
        links?: {
            /**
             * The id of this seed persona, must be the same as the id within the object.
             */
            [id: string]: {
                /**
                 * Id of the seed persona, must be the same as the key used to define this object.
                 */
                id: string;

                /**
                 * Id of the persona this seed persona is related to.
                 */
                relatedTo: string;

                /**
                 * Properties of this seed persona.
                 */
                properties: Array<{
                    /**
                     * Reference id of te entity thi property represents.
                     */
                    entityRefId: string;

                    /**
                     * Count that this property represents.
                     */
                    count: number;
                }>;
            }
        };

        other?: {
            count: number;
            metadata: any;
        };
    };

    /**
     * Seed personas, or personas that have the potential to become personas.
     */
    seeds?: {
        /**
         * The id of this seed persona, must be the same as the id within the object.
         */
        [id: string]: {
            /**
             * Id of the seed persona, must be the same as the key used to define this object.
             */
            id: string;

            /**
             * Id of the persona this seed persona is related to.
             */
            relatedTo: string;

            /**
             * Properties of this seed persona.
             */
            properties: Array<{

                /**
                 * Reference id of the entity this property represents.
                 */
                entityRefId: string;

                /**
                 * Count that this property represents.
                 */
                count: number;
            }>;
        }
    };

    links?: Array<{
        source: string,
        target: string,
        weight?: number,
        length?: number
    }>;
}

export interface IPersonasSelection {
    personaId: string;
    data: Array<{
        color: string;
        count: number;
    }>;
}

export interface IPersonasSubSelection {
    personaId: string;
    count: number;
    color: string;
}

/**
 * Object containing callback functions to be invoked when different events happen at runtime.
 */
export interface IPersonasOptions {
    hooks?: {
        /* *
         * Invoked when the user clicks on a persona effectively selecting or deselcting it,
         * this callback is also invoked when the user deselects all personas by clicking on an empty space.
         */
        onSelectPersona?: Function;

        /**
         * Invoked when the places the mouse pointer on top of a persona.
         */
        onHoverPersona?: Function;

        /**
         * Invoked if merging personas is enabled and the user drags a persona on top of another completing a merge between them.
         */
        onMergePersona?: Function;
    };

    /**
     * Should the `entityIcons` be auto generated, if set to `false` the `entityIcons` field must be present.
     */
    autoGenerateIconMap?: boolean;

    /**
     * Array containing information about entities within the clusters which a personas represent.
     */
    entityIcons?: Array<{
        /**
         * Type of entity. what is it.
         */
            type: string;
        class?: string;

        /**
         * Overall color of this entity.
         */
        color: string;

        /**
         * The id by which this entity will be referenced.
         */
        entityRefId?: string;

        /**
         * Name of the entity
         */
        name?: string;
        isDefault?: boolean;
    }>;

    Persona?: {
        layout?: {
            /**
             * Text padding used in a persona's label.
             */
            textpadding?: number;
            /**
             * The height of the gauge bars above a persona; must be in sync with the value defined in the CSS style.
             */
            progressHeight?: number;

            /**
             * Minimum diameter in pixels of a persona.
             */
            minSize?: number;

            /**
             * Maximum diameter in pixels of a persona.
             */
            maxSize?: number;

            /**
             * Size of the border displayed when a persona is selected; must be in sync with the value defined in the CSS style.
             */
            selectedBorder?: number;

            /**
             * Layout system type to use when positioning the personas. Options so far are 'orbital' and  'cola'
             */
            systemtype?: string;
        };

        /**
         * Options used to render the gauges around personas.
         */
        pie?: {
            /**
             * Background color
             */
            baseColor?: string;

            /**
             * If no information about the entity can be found in the `entityIcons` and no default is
             * set for the entity type, this color will be used.
             */
            defaultColor?: string;

            /**
             * To avoid drawing too many gauge bars in personas with too many
             * properties, use this value as a threshold to only draw properties
             * which percentage value is higher than this.
             */
            minimumDisplayRatio?: number;
        };

        config?: {
            /**
             * The base duration for animations in milliseconds, not all animations
             * will have this duration this number is used as a suggestion.
             */
            animationsDurationBase?: number;

            /**
             * Default duration of transition animations.
             */
            transitionsDuration?: number;

            /**
             * Should users be able to change the position of personas by dragging them
             */
            moveEnabled?: boolean;

            /**
             * Should users be able to merge personas by dragging one on top of another
             */
            mergeEnabled?: boolean;

            /**
             * How much should two personas overlap for it to be considered as a merge attempt
             */
            mergeOverlapRatio?: number;

            /**
             * When personas are merged how much should the receiving persona grow
             */
            mergeScaleRatio?: number;

            /**
             * Should orbits where personas are placed drawn
             */
            drawOrbits?: boolean;

            /**
             * Seed personas animation duration in milliseconds. This is considered a suggestion.
             */
            seedAnimationDurationBase?: number;

            /**
             * Should colors be generated for personas and their properties if the data is missing color information.
             */
            autoGenerateFallbackColors?: boolean;

            /**
             * If colors are automatically generated what's the minimum value per channel that they should have (0 - 255)
             */
            autoColorClampMin?: number;

            /**
             * If colors are automatically generated what's the maximum value per channel that they should have (0 - 255)
             */
            autoColorClampMax?: number;

            /**
             * If colors should not be automatically generated, what should the default background color for personas be.
             */
            fallbackBackgroundColor?: string;

            subSelect?: {
                blur?: boolean;
                gray?: boolean;
            };
            registerWindowResize? :boolean;
        };
    };
}

/**
 * Represents the personas configuration saved within powerbi
 */
export interface IPersonasVisualConfiguration {
    /**
     * Where personas is zoomed
     */
    zoom?: {
        amount: number;
        origin: { x: number; y: number };
    };

    /**
     * The transform of the personas visual
     */
    transform?: string;
}