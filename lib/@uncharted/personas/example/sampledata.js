function getSampleData () {
    var data = {
        personas: [
            {
                id: '0',
                scalingFactor: 1,
                totalCount: 111,
                label: 'Trump',
                properties: [
                    {
                        count: 37,
                        color: '#d26502'
                    },
                    {
                        count: 20,
                        color: '#f0ab21'
                    },
                    {
                        count: 15,
                        color: '#35364e'
                    }
                ],
                images: [
                    'http://www.closeoutzone.com/images/products/en_us/marketplace/p131839b.jpg'
                ],
                links: null,
            },
            {
                id: '1',
                scalingFactor: 0.9012345679,
                totalCount: 103,
                label: '唐纳德·特朗普',
                properties: [
                    {
                        count: 36,
                        color: '#f0ab21'
                    }
                ],
                images: [
                    'https://pbs.twimg.com/media/CVfjLCxWEAAvG5S.jpg'
                ],
                links: null,
            },
            {
                id: '2',
                scalingFactor: 0.7530864198,
                totalCount: 91,
                label: 'Trump',
                properties: [
                    {
                        count: 28,
                        color: '#f9bac4'
                    }
                ],
                images: [
                    'http://media.glassdoor.com/sqll/3007/the-trump-organization-squarelogo-1426227083696.png'
                ],
                links: [
                    {
                        target: '0',
                        strength: 0.9,
                    },
                ],
            },
            {
                id: '3',
                scalingFactor: 0.6049382716,
                totalCount: 79,
                label: 'Ted Cruz',
                properties: [
                    {
                        count: 70,
                        color: '#441133'
                    }
                ],
                images: [
                    'http://cyber1news.com/upload/news/image_1452913213_62123160.jpg'
                ],
                links: [
                    {
                        target: '0',
                        strength: 0.3,
                    },
                ],
            },
            {
                id: '4',
                scalingFactor: 0.4444444444,
                totalCount: 66,
                label: 'GOP',
                properties: [
                    {
                        count: 35,
                        color: '#84d99a'
                    }
                ],
                images: [
                    'https://upload.wikimedia.org/wikipedia/en/thumb/8/83/Republican_Party_of_Hawaii_logo.png/170px-Republican_Party_of_Hawaii_logo.png'
                ],
                links: [
                    {
                        target: '0',
                        strength: 0.2,
                    },
                ],
            },
            {
                id: '5',
                scalingFactor: 0.2962962963,
                totalCount: 54,
                label: 'New York',
                properties: [
                    {
                        count: 16,
                        color: '#84d99a'
                    }
                ],
                images: [
                    'https://lh5.ggpht.com/wytWRnRbbGxX7aI1U8w3tQM1PRdLOZ3LO7ZfdUtwIyCG44nYiWdmvthaXkzUQJ7Cg7Q=w400'
                ],
                links: [
                    {
                        target: '0',
                        strength: 0.1,
                    },
                    {
                        target: '1',
                        strength: 0.3,
                    },
                ],
            },
            {
                id: '6',
                scalingFactor: 0.1728395062,
                totalCount: 44,
                label: 'Obama',
                properties: [
                    {
                        count: 36,
                        color: '#84d99a'
                    }
                ],
                images: [
                    'http://i2.cdn.turner.com/cnnnext/dam/assets/150213095929-27-obama-0213-super-169.jpg'
                ],
                links: [
                    {
                        target: '1',
                        strength: 0.2,
                    },
                ],
            },
            {
                id: '7',
                scalingFactor: 0.1111111111,
                totalCount: 39,
                label: 'U.S.',
                properties: [
                    {
                        count: 27,
                        color: '#223355'
                    }
                ],
                images: [
                    'http://s1.mbtcdn.com/company/logos/e7be85c51b730863324cc5f27d0436244769f274.jpg'
                ],
                links: [
                    {
                        target: '2',
                        strength: 0.5,
                    },
                ],
            },
            {
                id: '8',
                scalingFactor: 0,
                totalCount: 30,
                label: 'Cruz',
                properties: [
                    {
                        count: 19
                        ,
                        color: '#35364e'
                    }
                ],
                images: [
                    'http://images.politico.com/global/2015/06/21/150621_ted_cruz_ap_629_956x519.jpg'
                ],
                links: [
                    {
                        target: '2',
                        strength: 0.5,
                    },
                ],
            }
        ]
    };

    return data;
}

function getExtraSampleData() {
    var data = {
        personas: [
            {
                id: '0',
                scalingFactor: 0.88,
                totalCount: 111,
                label: 'Trump',
                properties: [
                    {
                        count: 50,
                        color: '#d26502',
                    },
                ],
                images: [
                    'http://www.closeoutzone.com/images/products/en_us/marketplace/p131839b.jpg'
                ],
                links: null,
            },
            {
                id: '1',
                scalingFactor: 0.32,
                totalCount: 68,
                label: 'Donald Trump',
                properties: [
                    {
                        count: 28,
                        color: '#f0ab21',
                    },
                ],
                images: [
                    'https://pbs.twimg.com/media/CVfjLCxWEAAvG5S.jpg'
                ],
                links: null,
            },
            {
                id: '2',
                scalingFactor: 0.17,
                totalCount: 57,
                label: 'Trump',
                properties: [
                    {
                        count: 32,
                        color: '#f9bac4',
                    },
                ],
                images: [
                    'http://media.glassdoor.com/sqll/3007/the-trump-organization-squarelogo-1426227083696.png'
                ],
                links: null,
            },
            {
                id: '3',
                scalingFactor: 0.74,
                totalCount: 100,
                label: 'Ted Cruz',
                properties: [
                    {
                        count: 84,
                        color: '#441133',
                    },
                ],
                images: [
                    'http://cyber1news.com/upload/news/image_1452913213_62123160.jpg'
                ],
                links: null,
            },
            {
                id: '4',
                scalingFactor: 0,
                totalCount: 44,
                label: 'GOP',
                properties: [
                    {
                        count: 16,
                        color: '#84d99a',
                    },
                ],
                images: [
                    'https://upload.wikimedia.org/wikipedia/en/thumb/8/83/Republican_Party_of_Hawaii_logo.png/170px-Republican_Party_of_Hawaii_logo.png'
                ],
                links: null,
            },
            {
                id: '9',
                scalingFactor: 1,
                totalCount: 120,
                label: 'Obama',
                properties: [
                    {
                        count: 101,
                        color: '#8F8F8F',
                    },
                ],
                images: [
                    'http://i2.cdn.turner.com/cnnnext/dam/assets/150213095929-27-obama-0213-super-169.jpg'
                ],
                links: [
                    {
                        target: '3',
                        strength: 0.9,
                    },
                ],
            },
        ],
    };

    return data;
}

function getSubSelectData01() {
    var data = {
        personas: [
            {
                id: '0',
                totalCount: 111,
                properties: [
                    {
                        count: 111,
                        color: '#00bad3'
                    }
                ]
            },
            {
                id: '1',
                totalCount: 68,
                properties: [
                    {
                        count: 15,
                        color: '#00bad3'
                    }
                ]
            },
            {
                id: '2',
                totalCount: 57,
                properties: [
                    {
                        count: 48,
                        color: '#00bad3'
                    }
                ]
            }
        ]
    };

    return data;
}

function getSubSelectData02() {
    var data = {
        personas: [
            {
                id: '3',
                totalCount: 100,
                properties: [
                    {
                        count: 84,
                        color: '#00bad3'
                    }
                ]
            },
            {
                id: '4',
                totalCount: 44,
                properties: [
                    {
                        count: 20,
                        color: '#00bad3'
                    }
                ]
            },
            {
                id: '9',
                totalCount: 120,
                label: 'Obama',
                properties: [
                    {
                        count: 30,
                        color: '#00bad3'
                    }
                ]
            }
        ]
    };

    return data;
}

var _subLayerScale = 0.2;
var _subLayouts = [
    [
        {
            id: '0',
            scalingFactor: 0.88 * _subLayerScale,
            totalCount: 111,
            label: 'Trump',
            properties: [
                {
                    count: 50,
                    color: '#d26502',
                },
            ],
            images: [
                'http://www.closeoutzone.com/images/products/en_us/marketplace/p131839b.jpg'
            ],
            links: null,
        },
        {
            id: '1',
            scalingFactor: 0.32 * _subLayerScale,
            totalCount: 68,
            label: 'Donald Trump',
            properties: [
                {
                    count: 28,
                    color: '#f0ab21',
                },
            ],
            images: [
                'https://pbs.twimg.com/media/CVfjLCxWEAAvG5S.jpg'
            ],
            links: null,
        },
    ],
    [
        {
            id: '0',
            scalingFactor: 1 * _subLayerScale,
            totalCount: 111,
            label: 'Trump',
            properties: [
                {
                    count: 37,
                    color: '#d26502'
                },
                {
                    count: 20,
                    color: '#f0ab21'
                },
                {
                    count: 15,
                    color: '#35364e'
                }
            ],
            images: [
                'http://www.closeoutzone.com/images/products/en_us/marketplace/p131839b.jpg'
            ],
            links: null,
        },
        {
            id: '1',
            scalingFactor: 0.9012345679 * _subLayerScale,
            totalCount: 103,
            label: '唐纳德·特朗普',
            properties: [
                {
                    count: 36,
                    color: '#f0ab21'
                }
            ],
            images: [
                'https://pbs.twimg.com/media/CVfjLCxWEAAvG5S.jpg'
            ],
            links: null,
        },
    ],
    [
        {
            id: '2',
            scalingFactor: 0.7530864198 * _subLayerScale,
            totalCount: 91,
            label: 'Trump',
            properties: [
                {
                    count: 28,
                    color: '#f9bac4'
                }
            ],
            images: [
                'http://media.glassdoor.com/sqll/3007/the-trump-organization-squarelogo-1426227083696.png'
            ],
            links: [
                {
                    target: '0',
                    strength: 0.9,
                },
            ],
        },
        {
            id: '3',
            scalingFactor: 0.6049382716 * _subLayerScale,
            totalCount: 79,
            label: 'Ted Cruz',
            properties: [
                {
                    count: 70,
                    color: '#441133'
                }
            ],
            images: [
                'http://cyber1news.com/upload/news/image_1452913213_62123160.jpg'
            ],
            links: [
                {
                    target: '0',
                    strength: 0.3,
                },
            ],
        },
        {
            id: '4',
            scalingFactor: 0.4444444444 * _subLayerScale,
            totalCount: 66,
            label: 'GOP',
            properties: [
                {
                    count: 35,
                    color: '#84d99a'
                }
            ],
            images: [
                'https://upload.wikimedia.org/wikipedia/en/thumb/8/83/Republican_Party_of_Hawaii_logo.png/170px-Republican_Party_of_Hawaii_logo.png'
            ],
            links: [
                {
                    target: '0',
                    strength: 0.2,
                },
            ],
        },
        {
            id: '5',
            scalingFactor: 0.2962962963 * _subLayerScale,
            totalCount: 54,
            label: 'New York',
            properties: [
                {
                    count: 16,
                    color: '#84d99a'
                }
            ],
            images: [
                'https://lh5.ggpht.com/wytWRnRbbGxX7aI1U8w3tQM1PRdLOZ3LO7ZfdUtwIyCG44nYiWdmvthaXkzUQJ7Cg7Q=w400'
            ],
            links: [
                {
                    target: '0',
                    strength: 0.1,
                },
                {
                    target: '1',
                    strength: 0.3,
                },
            ],
        },
    ],
    [
        {
            id: '7',
            scalingFactor: 0.1111111111 * _subLayerScale,
            totalCount: 39,
            label: 'U.S.',
            properties: [
                {
                    count: 27,
                    color: '#223355'
                }
            ],
            images: [
                'http://s1.mbtcdn.com/company/logos/e7be85c51b730863324cc5f27d0436244769f274.jpg'
            ],
            links: [
                {
                    target: '2',
                    strength: 0.5,
                },
            ],
        },
        {
            id: '8',
            scalingFactor: 0 * _subLayerScale,
            totalCount: 30,
            label: 'Cruz',
            properties: [
                {
                    count: 19
                    ,
                    color: '#35364e'
                }
            ],
            images: [
                'http://images.politico.com/global/2015/06/21/150621_ted_cruz_ap_629_956x519.jpg'
            ],
            links: [
                {
                    target: '2',
                    strength: 0.5,
                },
            ],
        }
    ],
    [
        {
            id: '3',
            scalingFactor: 0.74 * _subLayerScale,
            totalCount: 100,
            label: 'Ted Cruz',
            properties: [
                {
                    count: 84,
                    color: '#441133',
                },
            ],
            images: [
                'http://cyber1news.com/upload/news/image_1452913213_62123160.jpg'
            ],
            links: null,
        },
        {
            id: '4',
            scalingFactor: 0 * _subLayerScale,
            totalCount: 44,
            label: 'GOP',
            properties: [
                {
                    count: 16,
                    color: '#84d99a',
                },
            ],
            images: [
                'https://upload.wikimedia.org/wikipedia/en/thumb/8/83/Republican_Party_of_Hawaii_logo.png/170px-Republican_Party_of_Hawaii_logo.png'
            ],
            links: null,
        },
        {
            id: '9',
            scalingFactor: 1 * _subLayerScale,
            totalCount: 120,
            label: 'Obama',
            properties: [
                {
                    count: 101,
                    color: '#8F8F8F',
                },
            ],
            images: [
                'http://i2.cdn.turner.com/cnnnext/dam/assets/150213095929-27-obama-0213-super-169.jpg'
            ],
            links: [
                {
                    target: '3',
                    strength: 0.9,
                },
            ],
        },
    ]
];
var direction = 0;
function getOuterLayoutData(index) {
    var count = Math.round(Math.random() * 3) + 1;
    var directionSlice = (Math.PI * 2) / count;
    direction += Math.PI * Math.random();

    var result = [];
    for (var i = 0; i < count; ++i) {
        direction += directionSlice;
        if (direction > Math.PI * 2) {
            direction -= Math.PI * 2;
        }

        result.push({
            personas: _subLayouts[(index + i) % _subLayouts.length],
            direction: direction,
            distance: Math.random(),
        });
    }

    return result;
}

//var config = {
//
//    propertyDescriptors: [
//        {
//            "displayName": "Phone Number",
//            "key": "phonenumber",
//            "class": ""
//        }
//    ]
//
//}
