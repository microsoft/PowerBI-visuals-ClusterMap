function getSampleData () {
    var data = {
        "entityRefs": {
            "PERSON_2": {
                "id": "PERSON_2",
                "name": "Trump",
                "type": "person",
                "imageUrl": ["http://photos1.blogger.com/blogger/2678/1252/1600/trumpdoll.jpg"]
            },
            "PERSON_33": {
                "id": "PERSON_33",
                "name": "Donald Trump",
                "type": "person",
                "imageUrl": ["http://img2-2.timeinc.net/people/i/2015/news/151116/donald-trump-75.jpg"]
            },
            "PERSON_0": {
                "id": "PERSON_0",
                "name": "Cruz",
                "type": "person",
                "imageUrl": ["http://www.theblaze.com/wp-content/uploads/2014/09/ted-cruz-e1410721061651.jpg"]
            },
            "PERSON_43": {
                "id": "PERSON_43",
                "name": "Obama",
                "type": "person",
                "imageUrl": ["http://www.morningliberty.com/wp-content/uploads/2013/03/Gay-Barack-Obama-91372-150x150.jpg"]
            },
            "PERSON_4": {
                "id": "PERSON_4",
                "name": "Ted Cruz",
                "type": "person",
                "imageUrl": ["http://cyber1news.com/upload/news/image_1452913213_62123160.jpg"]
            },
            "LOCATION_8": {
                "id": "LOCATION_8",
                "name": "New York",
                "type": "location",
                "imageUrl": ["https://lh5.ggpht.com/wytWRnRbbGxX7aI1U8w3tQM1PRdLOZ3LO7ZfdUtwIyCG44nYiWdmvthaXkzUQJ7Cg7Q=w400"]
            },
            "LOCATION_73": {
                "id": "LOCATION_73",
                "name": "U.S.",
                "type": "location",
                "imageUrl": ["http://s1.mbtcdn.com/company/logos/e7be85c51b730863324cc5f27d0436244769f274.jpg"]
            },
            "ORGANIZATION_10": {
                "id": "ORGANIZATION_10",
                "name": "Trump",
                "type": "organization",
                "imageUrl": ["http://media.glassdoor.com/sqll/3007/the-trump-organization-squarelogo-1426227083696.png"]
            },
            "ORGANIZATION_60": {
                "id": "ORGANIZATION_60",
                "name": "GOP",
                "type": "organization",
                "imageUrl": ["https://upload.wikimedia.org/wikipedia/en/thumb/8/83/Republican_Party_of_Hawaii_logo.png/170px-Republican_Party_of_Hawaii_logo.png"]
            }
        },
        "aggregates": {
            "personas": {
                "0": {
                    "id": "0",
                    "properties": [
                        {
                            "entityRefId": "PERSON_2",
                            "count": 37,
                            "isprimary": true,
                            "color": null
                        }
                    ],
                    "imageUrl": null,
                    "totalCount": 111
                },
                "1": {
                    "id": "1",
                    "properties": [
                        {
                            "entityRefId": "PERSON_33",
                            "count": 36,
                            "isprimary": true,
                            "color": null
                        }
                    ],
                    "imageUrl": null,
                    "totalCount": 111
                },
                "2": {
                    "id": "2",
                    "properties": [
                        {
                            "entityRefId": "ORGANIZATION_10",
                            "count": 28,
                            "isprimary": true,
                            "color": null
                        }
                    ],
                    "imageUrl": null,
                    "totalCount": 44
                },
                "3": {
                    "id": "3",
                    "properties": [
                        {
                            "entityRefId": "PERSON_4",
                            "count": 16,
                            "isprimary": true,
                            "color": null
                        }
                    ],
                    "imageUrl": null,
                    "totalCount": 111
                },
                "4": {
                    "id": "4",
                    "properties": [
                        {
                            "entityRefId": "ORGANIZATION_60",
                            "count": 16,
                            "isprimary": true,
                            "color": null
                        }
                    ],
                    "imageUrl": null,
                    "totalCount": 44
                },
                "5": {
                    "id": "5",
                    "properties": [
                        {
                            "entityRefId": "LOCATION_8",
                            "count": 15,
                            "isprimary": true,
                            "color": null
                        }
                    ],
                    "imageUrl": null,
                    "totalCount": 28
                },
                "6": {
                    "id": "6",
                    "properties": [
                        {
                            "entityRefId": "PERSON_43",
                            "count": 14,
                            "isprimary": true,
                            "color": null
                        }
                    ],
                    "imageUrl": null,
                    "totalCount": 111
                },
                "7": {
                    "id": "7",
                    "properties": [
                        {
                            "entityRefId": "LOCATION_73",
                            "count": 13,
                            "isprimary": true,
                            "color": null
                        }
                    ],
                    "imageUrl": null,
                    "totalCount": 28
                },
                "8": {
                    "id": "8",
                    "properties": [
                        {
                            "entityRefId": "PERSON_0",
                            "count": 8,
                            "isprimary": true,
                            "color": null
                        }
                    ],
                    "imageUrl": null,
                    "totalCount": 111
                }
            },
            "seeds": {
                "10": {
                    "id":"10",
                    "relatedTo": "1",
                    "properties": [{
                        "entityRefId": "SOMETHING_0",
                        "count": 2
                    }]
                },
                "11": {
                    "id":"11",
                    "relatedTo": "2",
                    "properties": [{
                        "type": "phonenumber",
                        "count": 12,
                        "value": "1 800 321 4321"
                    }]
                },
            },
            "links": [
                {
                    "source": "3",
                    "target": "0",
                    "weight": 0.3
                },
                {
                    "source": "4",
                    "target": "0",
                    "weight": 0.2
                },
                {
                    "source": "5",
                    "target": "0",
                    "weight": 0.1
                },
                {
                    "source": "2",
                    "target": "0",
                    "weight": 0.9
                },
                {
                    "source": "5",
                    "target": "1",
                    "weight": 0.3
                },
                {
                    "source": "6",
                    "target": "1",
                    "weight": 0.2
                },
                {
                    "source": "7",
                    "target": "2",
                    "weight": 0.5
                },
                {
                    "source": "8",
                    "target": "2",
                    "weight": 0.5
                }
            ],
            "other": {
                "count": 9,
                "metadata:": {
                    "anything": "can be stored here"
                }
            }
        }
    };

    return data;
}

function getExtraSampleData() {
    var data = {
        "entityRefs": {
            "PERSON_2": {
                "id": "PERSON_2",
                "name": "Trump",
                "type": "person",
                "imageUrl": ["http://www.closeoutzone.com/images/products/en_us/marketplace/p131839b.jpg"]
            },
            "PERSON_33": {
                "id": "PERSON_33",
                "name": "Donald Trump",
                "type": "person",
                "imageUrl": "https://pbs.twimg.com/media/CVfjLCxWEAAvG5S.jpg"
            },
            "PERSON_0": {
                "id": "PERSON_0",
                "name": "Cruz",
                "type": "person",
                "imageUrl": "http://images.politico.com/global/2015/06/21/150621_ted_cruz_ap_629_956x519.jpg"
            },
            "PERSON_43": {
                "id": "PERSON_43",
                "name": "Obama",
                "type": "person",
                "imageUrl": "http://i2.cdn.turner.com/cnnnext/dam/assets/150213095929-27-obama-0213-super-169.jpg"
            },
            "PERSON_4": {
                "id": "PERSON_4",
                "name": "Ted Cruz",
                "type": "person",
                "imageUrl": "http://cyber1news.com/upload/news/image_1452913213_62123160.jpg"
            },
            "LOCATION_8": {
                "id": "LOCATION_8",
                "name": "New York",
                "type": "location",
                "imageUrl": "https://lh5.ggpht.com/wytWRnRbbGxX7aI1U8w3tQM1PRdLOZ3LO7ZfdUtwIyCG44nYiWdmvthaXkzUQJ7Cg7Q=w400"
            },
            "LOCATION_73": {
                "id": "LOCATION_73",
                "name": "U.S.",
                "type": "location",
                "imageUrl": "http://s1.mbtcdn.com/company/logos/e7be85c51b730863324cc5f27d0436244769f274.jpg"
            },
            "ORGANIZATION_10": {
                "id": "ORGANIZATION_10",
                "name": "Trump",
                "type": "organization",
                "imageUrl": "http://media.glassdoor.com/sqll/3007/the-trump-organization-squarelogo-1426227083696.png"
            },
            "ORGANIZATION_60": {
                "id": "ORGANIZATION_60",
                "name": "GOP",
                "type": "organization",
                "imageUrl": "https://upload.wikimedia.org/wikipedia/en/thumb/8/83/Republican_Party_of_Hawaii_logo.png/170px-Republican_Party_of_Hawaii_logo.png"
            }
        },
        "aggregates": {
            "personas": {
                "0": {
                    "id": "0",
                    "properties": [
                        {
                            "entityRefId": "PERSON_2",
                            "count": 50,
                            "isprimary": true,
                            "color": null
                        }
                    ],
                    "imageUrl": null,
                    "totalCount": 111
                },
                "1": {
                    "id": "1",
                    "properties": [
                        {
                            "entityRefId": "PERSON_33",
                            "count": 28,
                            "isprimary": true,
                            "color": null
                        }
                    ],
                    "imageUrl": null,
                    "totalCount": 111
                },
                "2": {
                    "id": "2",
                    "properties": [
                        {
                            "entityRefId": "ORGANIZATION_10",
                            "count": 32,
                            "isprimary": true,
                            "color": null
                        }
                    ],
                    "imageUrl": null,
                    "totalCount": 44
                },
                "3": {
                    "id": "3",
                    "properties": [
                        {
                            "entityRefId": "PERSON_4",
                            "count": 84,
                            "isprimary": true,
                            "color": null
                        }
                    ],
                    "imageUrl": null,
                    "totalCount": 111
                },
                "4": {
                    "id": "4",
                    "properties": [
                        {
                            "entityRefId": "ORGANIZATION_60",
                            "count": 16,
                            "isprimary": true,
                            "color": null
                        }
                    ],
                    "imageUrl": null,
                    "totalCount": 44
                },
                "9": {
                    "id": "9",
                    "properties": [
                        {
                            "entityRefId": "PERSON_43",
                            "count": 101,
                            "isprimary": true,
                            "color": null
                        }
                    ],
                    "imageUrl": null,
                    "totalCount": 111
                }
            },
            "seeds": {
                "10": {
                    "id":"10",
                    "relatedTo": "1",
                    "properties": [{
                        "entityRefId": "SOMETHING_0",
                        "count": 2
                    }]
                },
                "13": {
                    "id":"13",
                    "relatedTo": "9",
                    "properties": [{
                        "type": "phonenumber",
                        "count": 53,
                        "value": "1 416 203 3003"
                    }]
                },
            },
            "links": [
                {
                    "source": "3",
                    "target": "9",
                    "weight": 0.9
                }
            ],
            "other": {
                "count": 0
            }
        }
    };

    return data;
}

function getIconMap () {
    var iconMap = [
        {
            "type": "person",
            "class": "fa fa-male",
            "color": "#400000",
            "entityRefId": "PERSON_137",
            "name": "Clinton"
        },
        {
            "type": "person",
            "class": "fa fa-male",
            "color": "#d26502",
            "entityRefId": "PERSON_2",
            "name": "Trump"
        },
        {
            "type": "person",
            "class": "fa fa-male",
            "color": "#f0ab21",
            "entityRefId": "PERSON_33",
            "name": "Donald Trump"
        },
        {
            "type": "person",
            "class": "fa fa-male",
            "color": "#9ab3ca",
            "entityRefId": "PERSON_19",
            "name": "Bush"
        },
        {
            "type": "person",
            "class": "fa fa-male",
            "color": "#35364e",
            "entityRefId": "PERSON_0",
            "name": "Cruz"
        },
        {
            "type": "person",
            "class": "fa fa-male",
            "color": "#8F8F8F",
            "isDefault": true
        },
        {
            "type": "location",
            "class": "fa fa-globe",
            "color": "#1b2c3f",
            "entityRefId": "LOCATION_46",
            "name": "Iowa"
        },
        {
            "type": "location",
            "class": "fa fa-globe",
            "color": "#3d697a",
            "entityRefId": "LOCATION_7",
            "name": "United States"
        },
        {
            "type": "location",
            "class": "fa fa-globe",
            "color": "#a68900"
        },
        {
            "type": "location",
            "class": "fa fa-globe",
            "color": "#f4651a"
        },
        {
            "type": "location",
            "class": "fa fa-globe",
            "color": "#fca771"
        },
        {
            "type": "location",
            "class": "fa fa-globe",
            "color": "#8F8F8F",
            "isDefault": true
        },
        {
            "type": "organization",
            "class": "fa fa-building",
            "color": "#f9bac4",
            "entityRefId": "ORGANIZATION_10",
            "name": "Trump"
        },
        {
            "type": "organization",
            "class": "fa fa-building",
            "color": "#d2e5eb",
            "entityRefId": "ORGANIZATION_63",
            "name": "Trump & #x"
        },
        {
            "type": "organization",
            "class": "fa fa-building",
            "color": "#91d4d1"
        },
        {
            "type": "organization",
            "class": "fa fa-building",
            "color": "#e5ab6a"
        },
        {
            "type": "organization",
            "class": "fa fa-building",
            "color": "#58373e"
        },
        {
            "type": "organization",
            "class": "fa fa-building",
            "color": "#8F8F8F",
            "isDefault": true
        }
    ];

    return iconMap;
}

function getSubSelectData01() {
    var data = [
        {'personaId':'0', 'count':15, 'color':'#abba44'},
        {'personaId':'4', 'count':15, 'color':'#44baab'},
        {'personaId':'8', 'count':15, 'color':'#ba44ab'},
    ];

    return data;
}

function getSubSelectData02() {
    var data = [
        {'personaId':'1', 'count':20, 'color':'#44abba'},
        {'personaId':'4', 'count':20, 'color':'#baab44'},
        {'personaId':'6', 'count':20, 'color':'#4baab4'},
    ];

    return data;
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
