/**
 * Copyright (c) 2016 Uncharted Software Inc.
 * http://www.uncharted.software/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the 'Software'), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
export default {
    'metadata': {
        'columns': [
            {
                'roles': {
                    'PersonaGroup': true,
                    'ReferenceName': true
                },
                'type': {
                    'underlyingType': 1,
                    'category': null
                },
                'displayName': 'cluster_label',
                'queryName': 'linkedClusters.cluster_label',
                'expr': {
                    '_kind': 2,
                    'source': {
                        '_kind': 0,
                        'entity': 'linkedClusters'
                    },
                    'ref': 'cluster_label'
                }
            },
            {
                'roles': {
                    'ReferenceCount': true
                },
                'type': {
                    'underlyingType': 260,
                    'category': null
                },
                'displayName': 'Count of article_id',
                'queryName': 'Sum(linkedClusters.article_id)',
                'expr': {
                    '_kind': 4,
                    'arg': {
                        '_kind': 2,
                        'source': {
                            '_kind': 0,
                            'entity': 'linkedClusters'
                        },
                        'ref': 'article_id'
                    },
                    'func': 2
                }
            }
        ]
    },
    'categorical': {
        'categories': [
            {
                'source': {
                    'roles': {
                        'PersonaGroup': true,
                        'ReferenceName': true
                    },
                    'type': {
                        'underlyingType': 1,
                        'category': null
                    },
                    'displayName': 'cluster_label',
                    'queryName': 'linkedClusters.cluster_label',
                    'expr': {
                        '_kind': 2,
                        'source': {
                            '_kind': 0,
                            'entity': 'linkedClusters'
                        },
                        'ref': 'cluster_label'
                    }
                }
            }
        ],
        'values': [
            {
                'source': {
                    'roles': {
                        'ReferenceCount': true
                    },
                    'type': {
                        'underlyingType': 260,
                        'category': null
                    },
                    'displayName': 'Count of article_id',
                    'queryName': 'Sum(linkedClusters.article_id)',
                    'expr': {
                        '_kind': 4,
                        'arg': {
                            '_kind': 2,
                            'source': {
                                '_kind': 0,
                                'entity': 'linkedClusters'
                            },
                            'ref': 'article_id'
                        },
                        'func': 2
                    }
                }
            }
        ]
    },
    'tree': {
        'root': {
            'children': [
                {
                    'name': '&#8216;America First&#8217; - Donald Trump vows to quit TPP trade deal',
                    'values': [
                        {
                            'value': '&#8216;America First&#8217; - Donald Trump vows to quit TPP trade deal'
                        },
                        {
                            'value': 1
                        }
                    ],
                    'value': 1,
                    'identity': {
                        '_expr': {
                            '_kind': 13,
                            'comparison': 0,
                            'left': {
                                '_kind': 2,
                                'source': {
                                    '_kind': 0,
                                    'entity': 'linkedClusters'
                                },
                                'ref': 'cluster_label'
                            },
                            'right': {
                                '_kind': 17,
                                'type': {
                                    'underlyingType': 1,
                                    'category': null
                                },
                                'value': '&#8216;America First&#8217; - Donald Trump vows to quit TPP trade deal',
                                'valueEncoded': '\'&#8216;America First&#8217; - Donald Trump vows to quit TPP trade deal\''
                            }
                        },
                        '_key': {}
                    }
                },
                {
                    'name': '&#8216;Hamilton&#8217; vs Donald Trump-Mike Pence: A Timeline',
                    'values': [
                        {
                            'value': '&#8216;Hamilton&#8217; vs Donald Trump-Mike Pence: A Timeline'
                        },
                        {
                            'value': 1
                        }
                    ],
                    'value': 1,
                    'identity': {
                        '_expr': {
                            '_kind': 13,
                            'comparison': 0,
                            'left': {
                                '_kind': 2,
                                'source': {
                                    '_kind': 0,
                                    'entity': 'linkedClusters'
                                },
                                'ref': 'cluster_label'
                            },
                            'right': {
                                '_kind': 17,
                                'type': {
                                    'underlyingType': 1,
                                    'category': null
                                },
                                'value': '&#8216;Hamilton&#8217; vs Donald Trump-Mike Pence: A Timeline',
                                'valueEncoded': '\'&#8216;Hamilton&#8217; vs Donald Trump-Mike Pence: A Timeline\''
                            }
                        },
                        '_key': {}
                    }
                },
                {
                    'name': 'Donald Trump disavows racist alt-right: &#8216;Not a group I want to energize&#8217;',
                    'values': [
                        {
                            'value': 'Donald Trump disavows racist alt-right: &#8216;Not a group I want to energize&#8217;'
                        },
                        {
                            'value': 5
                        }
                    ],
                    'value': 5,
                    'identity': {
                        '_expr': {
                            '_kind': 13,
                            'comparison': 0,
                            'left': {
                                '_kind': 2,
                                'source': {
                                    '_kind': 0,
                                    'entity': 'linkedClusters'
                                },
                                'ref': 'cluster_label'
                            },
                            'right': {
                                '_kind': 17,
                                'type': {
                                    'underlyingType': 1,
                                    'category': null
                                },
                                'value': 'Donald Trump disavows racist alt-right: &#8216;Not a group I want to energize&#8217;',
                                'valueEncoded': '\'Donald Trump disavows racist alt-right: &#8216;Not a group I want to energize&#8217;\''
                            }
                        },
                        '_key': {}
                    }
                },
                {
                    'name': 'Donald Trump faces storm over claims he asked Argentine president for help with office project',
                    'values': [
                        {
                            'value': 'Donald Trump faces storm over claims he asked Argentine president for help with office project'
                        },
                        {
                            'value': 7
                        }
                    ],
                    'value': 7,
                    'identity': {
                        '_expr': {
                            '_kind': 13,
                            'comparison': 0,
                            'left': {
                                '_kind': 2,
                                'source': {
                                    '_kind': 0,
                                    'entity': 'linkedClusters'
                                },
                                'ref': 'cluster_label'
                            },
                            'right': {
                                '_kind': 17,
                                'type': {
                                    'underlyingType': 1,
                                    'category': null
                                },
                                'value': 'Donald Trump faces storm over claims he asked Argentine president for help with office project',
                                'valueEncoded': '\'Donald Trump faces storm over claims he asked Argentine president for help with office project\''
                            }
                        },
                        '_key': {}
                    }
                },
                {
                    'name': 'The Island',
                    'values': [
                        {
                            'value': 'The Island'
                        },
                        {
                            'value': 1
                        }
                    ],
                    'value': 1,
                    'identity': {
                        '_expr': {
                            '_kind': 13,
                            'comparison': 0,
                            'left': {
                                '_kind': 2,
                                'source': {
                                    '_kind': 0,
                                    'entity': 'linkedClusters'
                                },
                                'ref': 'cluster_label'
                            },
                            'right': {
                                '_kind': 17,
                                'type': {
                                    'underlyingType': 1,
                                    'category': null
                                },
                                'value': 'The Island',
                                'valueEncoded': '\'The Island\''
                            }
                        },
                        '_key': {}
                    }
                },
                {
                    'name': 'Trump Lets Hillary Off The Hook For E-Mails And Corruption',
                    'values': [
                        {
                            'value': 'Trump Lets Hillary Off The Hook For E-Mails And Corruption'
                        },
                        {
                            'value': 3
                        }
                    ],
                    'value': 3,
                    'identity': {
                        '_expr': {
                            '_kind': 13,
                            'comparison': 0,
                            'left': {
                                '_kind': 2,
                                'source': {
                                    '_kind': 0,
                                    'entity': 'linkedClusters'
                                },
                                'ref': 'cluster_label'
                            },
                            'right': {
                                '_kind': 17,
                                'type': {
                                    'underlyingType': 1,
                                    'category': null
                                },
                                'value': 'Trump Lets Hillary Off The Hook For E-Mails And Corruption',
                                'valueEncoded': '\'Trump Lets Hillary Off The Hook For E-Mails And Corruption\''
                            }
                        },
                        '_key': {}
                    }
                },
                {
                    'name': 'Trump skips press, outlines first 100 days on YouTube',
                    'values': [
                        {
                            'value': 'Trump skips press, outlines first 100 days on YouTube'
                        },
                        {
                            'value': 8
                        }
                    ],
                    'value': 8,
                    'identity': {
                        '_expr': {
                            '_kind': 13,
                            'comparison': 0,
                            'left': {
                                '_kind': 2,
                                'source': {
                                    '_kind': 0,
                                    'entity': 'linkedClusters'
                                },
                                'ref': 'cluster_label'
                            },
                            'right': {
                                '_kind': 17,
                                'type': {
                                    'underlyingType': 1,
                                    'category': null
                                },
                                'value': 'Trump skips press, outlines first 100 days on YouTube',
                                'valueEncoded': '\'Trump skips press, outlines first 100 days on YouTube\''
                            }
                        },
                        '_key': {}
                    }
                },
                {
                    'name': 'Trump tells New York Times he doesn\'t want to \'hurt the Clintons\'',
                    'values': [
                        {
                            'value': 'Trump tells New York Times he doesn\'t want to \'hurt the Clintons\''
                        },
                        {
                            'value': 1
                        }
                    ],
                    'value': 1,
                    'identity': {
                        '_expr': {
                            '_kind': 13,
                            'comparison': 0,
                            'left': {
                                '_kind': 2,
                                'source': {
                                    '_kind': 0,
                                    'entity': 'linkedClusters'
                                },
                                'ref': 'cluster_label'
                            },
                            'right': {
                                '_kind': 17,
                                'type': {
                                    'underlyingType': 1,
                                    'category': null
                                },
                                'value': 'Trump tells New York Times he doesn\'t want to \'hurt the Clintons\'',
                                'valueEncoded': '\'Trump tells New York Times he doesn\'\'t want to \'\'hurt the Clintons\'\'\''
                            }
                        },
                        '_key': {}
                    }
                },
                {
                    'name': 'Trump&#8217;s big agenda could put GOP&#8217;s budget goals out of reach',
                    'values': [
                        {
                            'value': 'Trump&#8217;s big agenda could put GOP&#8217;s budget goals out of reach'
                        },
                        {
                            'value': 6
                        }
                    ],
                    'value': 6,
                    'identity': {
                        '_expr': {
                            '_kind': 13,
                            'comparison': 0,
                            'left': {
                                '_kind': 2,
                                'source': {
                                    '_kind': 0,
                                    'entity': 'linkedClusters'
                                },
                                'ref': 'cluster_label'
                            },
                            'right': {
                                '_kind': 17,
                                'type': {
                                    'underlyingType': 1,
                                    'category': null
                                },
                                'value': 'Trump&#8217;s big agenda could put GOP&#8217;s budget goals out of reach',
                                'valueEncoded': '\'Trump&#8217;s big agenda could put GOP&#8217;s budget goals out of reach\''
                            }
                        },
                        '_key': {}
                    }
                },
                {
                    'name': 'Trump, Trauma and the Triumph of Hate',
                    'values': [
                        {
                            'value': 'Trump, Trauma and the Triumph of Hate'
                        },
                        {
                            'value': 3
                        }
                    ],
                    'value': 3,
                    'identity': {
                        '_expr': {
                            '_kind': 13,
                            'comparison': 0,
                            'left': {
                                '_kind': 2,
                                'source': {
                                    '_kind': 0,
                                    'entity': 'linkedClusters'
                                },
                                'ref': 'cluster_label'
                            },
                            'right': {
                                '_kind': 17,
                                'type': {
                                    'underlyingType': 1,
                                    'category': null
                                },
                                'value': 'Trump, Trauma and the Triumph of Hate',
                                'valueEncoded': '\'Trump, Trauma and the Triumph of Hate\''
                            }
                        },
                        '_key': {}
                    }
                }
            ],
            'childIdentityFields': [
                {
                    '_kind': 2,
                    'source': {
                        '_kind': 0,
                        'entity': 'linkedClusters'
                    },
                    'ref': 'cluster_label'
                }
            ],
            'values': {
                '1': {
                    'minLocal': 1,
                    'maxLocal': 8
                }
            }
        }
    },
    'table': {
        'rows': [
            [
                '&#8216;America First&#8217; - Donald Trump vows to quit TPP trade deal',
                1
            ],
            [
                '&#8216;Hamilton&#8217; vs Donald Trump-Mike Pence: A Timeline',
                1
            ],
            [
                'Donald Trump disavows racist alt-right: &#8216;Not a group I want to energize&#8217;',
                5
            ],
            [
                'Donald Trump faces storm over claims he asked Argentine president for help with office project',
                7
            ],
            [
                'The Island',
                1
            ],
            [
                'Trump Lets Hillary Off The Hook For E-Mails And Corruption',
                3
            ],
            [
                'Trump skips press, outlines first 100 days on YouTube',
                8
            ],
            [
                'Trump tells New York Times he doesn\'t want to \'hurt the Clintons\'',
                1
            ],
            [
                'Trump&#8217;s big agenda could put GOP&#8217;s budget goals out of reach',
                6
            ],
            [
                'Trump, Trauma and the Triumph of Hate',
                3
            ]
        ],
        'columns': [
            {
                'displayName': '',
                'index': 0,
                'type': {
                    'underlyingType': 0,
                    'category': null
                },
                'identityExprs': [
                    {
                        '_kind': 2,
                        'source': {
                            '_kind': 0,
                            'entity': 'linkedClusters'
                        },
                        'ref': 'cluster_label'
                    }
                ]
            },
            {
                'displayName': '',
                'index': 1,
                'type': {
                    'underlyingType': 0,
                    'category': null
                },
                'isMeasure': true,
                'aggregates': {
                    'minLocal': 1,
                    'maxLocal': 8
                }
            }
        ],
        'identity': [
            {
                '_expr': {
                    '_kind': 13,
                    'comparison': 0,
                    'left': {
                        '_kind': 2,
                        'source': {
                            '_kind': 0,
                            'entity': 'linkedClusters'
                        },
                        'ref': 'cluster_label'
                    },
                    'right': {
                        '_kind': 17,
                        'type': {
                            'underlyingType': 1,
                            'category': null
                        },
                        'value': '&#8216;America First&#8217; - Donald Trump vows to quit TPP trade deal',
                        'valueEncoded': '\'&#8216;America First&#8217; - Donald Trump vows to quit TPP trade deal\''
                    }
                },
                '_key': {}
            },
            {
                '_expr': {
                    '_kind': 13,
                    'comparison': 0,
                    'left': {
                        '_kind': 2,
                        'source': {
                            '_kind': 0,
                            'entity': 'linkedClusters'
                        },
                        'ref': 'cluster_label'
                    },
                    'right': {
                        '_kind': 17,
                        'type': {
                            'underlyingType': 1,
                            'category': null
                        },
                        'value': '&#8216;Hamilton&#8217; vs Donald Trump-Mike Pence: A Timeline',
                        'valueEncoded': '\'&#8216;Hamilton&#8217; vs Donald Trump-Mike Pence: A Timeline\''
                    }
                },
                '_key': {}
            },
            {
                '_expr': {
                    '_kind': 13,
                    'comparison': 0,
                    'left': {
                        '_kind': 2,
                        'source': {
                            '_kind': 0,
                            'entity': 'linkedClusters'
                        },
                        'ref': 'cluster_label'
                    },
                    'right': {
                        '_kind': 17,
                        'type': {
                            'underlyingType': 1,
                            'category': null
                        },
                        'value': 'Donald Trump disavows racist alt-right: &#8216;Not a group I want to energize&#8217;',
                        'valueEncoded': '\'Donald Trump disavows racist alt-right: &#8216;Not a group I want to energize&#8217;\''
                    }
                },
                '_key': {}
            },
            {
                '_expr': {
                    '_kind': 13,
                    'comparison': 0,
                    'left': {
                        '_kind': 2,
                        'source': {
                            '_kind': 0,
                            'entity': 'linkedClusters'
                        },
                        'ref': 'cluster_label'
                    },
                    'right': {
                        '_kind': 17,
                        'type': {
                            'underlyingType': 1,
                            'category': null
                        },
                        'value': 'Donald Trump faces storm over claims he asked Argentine president for help with office project',
                        'valueEncoded': '\'Donald Trump faces storm over claims he asked Argentine president for help with office project\''
                    }
                },
                '_key': {}
            },
            {
                '_expr': {
                    '_kind': 13,
                    'comparison': 0,
                    'left': {
                        '_kind': 2,
                        'source': {
                            '_kind': 0,
                            'entity': 'linkedClusters'
                        },
                        'ref': 'cluster_label'
                    },
                    'right': {
                        '_kind': 17,
                        'type': {
                            'underlyingType': 1,
                            'category': null
                        },
                        'value': 'The Island',
                        'valueEncoded': '\'The Island\''
                    }
                },
                '_key': {}
            },
            {
                '_expr': {
                    '_kind': 13,
                    'comparison': 0,
                    'left': {
                        '_kind': 2,
                        'source': {
                            '_kind': 0,
                            'entity': 'linkedClusters'
                        },
                        'ref': 'cluster_label'
                    },
                    'right': {
                        '_kind': 17,
                        'type': {
                            'underlyingType': 1,
                            'category': null
                        },
                        'value': 'Trump Lets Hillary Off The Hook For E-Mails And Corruption',
                        'valueEncoded': '\'Trump Lets Hillary Off The Hook For E-Mails And Corruption\''
                    }
                },
                '_key': {}
            },
            {
                '_expr': {
                    '_kind': 13,
                    'comparison': 0,
                    'left': {
                        '_kind': 2,
                        'source': {
                            '_kind': 0,
                            'entity': 'linkedClusters'
                        },
                        'ref': 'cluster_label'
                    },
                    'right': {
                        '_kind': 17,
                        'type': {
                            'underlyingType': 1,
                            'category': null
                        },
                        'value': 'Trump skips press, outlines first 100 days on YouTube',
                        'valueEncoded': '\'Trump skips press, outlines first 100 days on YouTube\''
                    }
                },
                '_key': {}
            },
            {
                '_expr': {
                    '_kind': 13,
                    'comparison': 0,
                    'left': {
                        '_kind': 2,
                        'source': {
                            '_kind': 0,
                            'entity': 'linkedClusters'
                        },
                        'ref': 'cluster_label'
                    },
                    'right': {
                        '_kind': 17,
                        'type': {
                            'underlyingType': 1,
                            'category': null
                        },
                        'value': 'Trump tells New York Times he doesn\'t want to \'hurt the Clintons\'',
                        'valueEncoded': '\'Trump tells New York Times he doesn\'\'t want to \'\'hurt the Clintons\'\'\''
                    }
                },
                '_key': {}
            },
            {
                '_expr': {
                    '_kind': 13,
                    'comparison': 0,
                    'left': {
                        '_kind': 2,
                        'source': {
                            '_kind': 0,
                            'entity': 'linkedClusters'
                        },
                        'ref': 'cluster_label'
                    },
                    'right': {
                        '_kind': 17,
                        'type': {
                            'underlyingType': 1,
                            'category': null
                        },
                        'value': 'Trump&#8217;s big agenda could put GOP&#8217;s budget goals out of reach',
                        'valueEncoded': '\'Trump&#8217;s big agenda could put GOP&#8217;s budget goals out of reach\''
                    }
                },
                '_key': {}
            },
            {
                '_expr': {
                    '_kind': 13,
                    'comparison': 0,
                    'left': {
                        '_kind': 2,
                        'source': {
                            '_kind': 0,
                            'entity': 'linkedClusters'
                        },
                        'ref': 'cluster_label'
                    },
                    'right': {
                        '_kind': 17,
                        'type': {
                            'underlyingType': 1,
                            'category': null
                        },
                        'value': 'Trump, Trauma and the Triumph of Hate',
                        'valueEncoded': '\'Trump, Trauma and the Triumph of Hate\''
                    }
                },
                '_key': {}
            }
        ],
        'identityFields': [
            {
                '_kind': 2,
                'source': {
                    '_kind': 0,
                    'entity': 'linkedClusters'
                },
                'ref': 'cluster_label'
            }
        ]
    },
    'matrix': {
        'rows': {
            'root': {
                'children': [
                    {
                        'level': 0,
                        'levelValues': [
                            {
                                'levelSourceIndex': 0,
                                'value': '&#8216;America First&#8217; - Donald Trump vows to quit TPP trade deal'
                            }
                        ],
                        'value': '&#8216;America First&#8217; - Donald Trump vows to quit TPP trade deal',
                        'identity': {
                            '_expr': {
                                '_kind': 13,
                                'comparison': 0,
                                'left': {
                                    '_kind': 2,
                                    'source': {
                                        '_kind': 0,
                                        'entity': 'linkedClusters'
                                    },
                                    'ref': 'cluster_label'
                                },
                                'right': {
                                    '_kind': 17,
                                    'type': {
                                        'underlyingType': 1,
                                        'category': null
                                    },
                                    'value': '&#8216;America First&#8217; - Donald Trump vows to quit TPP trade deal',
                                    'valueEncoded': '\'&#8216;America First&#8217; - Donald Trump vows to quit TPP trade deal\''
                                }
                            },
                            '_key': {}
                        },
                        'values': [
                            {
                                'value': 1
                            }
                        ]
                    },
                    {
                        'level': 0,
                        'levelValues': [
                            {
                                'levelSourceIndex': 0,
                                'value': '&#8216;Hamilton&#8217; vs Donald Trump-Mike Pence: A Timeline'
                            }
                        ],
                        'value': '&#8216;Hamilton&#8217; vs Donald Trump-Mike Pence: A Timeline',
                        'identity': {
                            '_expr': {
                                '_kind': 13,
                                'comparison': 0,
                                'left': {
                                    '_kind': 2,
                                    'source': {
                                        '_kind': 0,
                                        'entity': 'linkedClusters'
                                    },
                                    'ref': 'cluster_label'
                                },
                                'right': {
                                    '_kind': 17,
                                    'type': {
                                        'underlyingType': 1,
                                        'category': null
                                    },
                                    'value': '&#8216;Hamilton&#8217; vs Donald Trump-Mike Pence: A Timeline',
                                    'valueEncoded': '\'&#8216;Hamilton&#8217; vs Donald Trump-Mike Pence: A Timeline\''
                                }
                            },
                            '_key': {}
                        },
                        'values': [
                            {
                                'value': 1
                            }
                        ]
                    },
                    {
                        'level': 0,
                        'levelValues': [
                            {
                                'levelSourceIndex': 0,
                                'value': 'Donald Trump disavows racist alt-right: &#8216;Not a group I want to energize&#8217;'
                            }
                        ],
                        'value': 'Donald Trump disavows racist alt-right: &#8216;Not a group I want to energize&#8217;',
                        'identity': {
                            '_expr': {
                                '_kind': 13,
                                'comparison': 0,
                                'left': {
                                    '_kind': 2,
                                    'source': {
                                        '_kind': 0,
                                        'entity': 'linkedClusters'
                                    },
                                    'ref': 'cluster_label'
                                },
                                'right': {
                                    '_kind': 17,
                                    'type': {
                                        'underlyingType': 1,
                                        'category': null
                                    },
                                    'value': 'Donald Trump disavows racist alt-right: &#8216;Not a group I want to energize&#8217;',
                                    'valueEncoded': '\'Donald Trump disavows racist alt-right: &#8216;Not a group I want to energize&#8217;\''
                                }
                            },
                            '_key': {}
                        },
                        'values': [
                            {
                                'value': 5
                            }
                        ]
                    },
                    {
                        'level': 0,
                        'levelValues': [
                            {
                                'levelSourceIndex': 0,
                                'value': 'Donald Trump faces storm over claims he asked Argentine president for help with office project'
                            }
                        ],
                        'value': 'Donald Trump faces storm over claims he asked Argentine president for help with office project',
                        'identity': {
                            '_expr': {
                                '_kind': 13,
                                'comparison': 0,
                                'left': {
                                    '_kind': 2,
                                    'source': {
                                        '_kind': 0,
                                        'entity': 'linkedClusters'
                                    },
                                    'ref': 'cluster_label'
                                },
                                'right': {
                                    '_kind': 17,
                                    'type': {
                                        'underlyingType': 1,
                                        'category': null
                                    },
                                    'value': 'Donald Trump faces storm over claims he asked Argentine president for help with office project',
                                    'valueEncoded': '\'Donald Trump faces storm over claims he asked Argentine president for help with office project\''
                                }
                            },
                            '_key': {}
                        },
                        'values': [
                            {
                                'value': 7
                            }
                        ]
                    },
                    {
                        'level': 0,
                        'levelValues': [
                            {
                                'levelSourceIndex': 0,
                                'value': 'The Island'
                            }
                        ],
                        'value': 'The Island',
                        'identity': {
                            '_expr': {
                                '_kind': 13,
                                'comparison': 0,
                                'left': {
                                    '_kind': 2,
                                    'source': {
                                        '_kind': 0,
                                        'entity': 'linkedClusters'
                                    },
                                    'ref': 'cluster_label'
                                },
                                'right': {
                                    '_kind': 17,
                                    'type': {
                                        'underlyingType': 1,
                                        'category': null
                                    },
                                    'value': 'The Island',
                                    'valueEncoded': '\'The Island\''
                                }
                            },
                            '_key': {}
                        },
                        'values': [
                            {
                                'value': 1
                            }
                        ]
                    },
                    {
                        'level': 0,
                        'levelValues': [
                            {
                                'levelSourceIndex': 0,
                                'value': 'Trump Lets Hillary Off The Hook For E-Mails And Corruption'
                            }
                        ],
                        'value': 'Trump Lets Hillary Off The Hook For E-Mails And Corruption',
                        'identity': {
                            '_expr': {
                                '_kind': 13,
                                'comparison': 0,
                                'left': {
                                    '_kind': 2,
                                    'source': {
                                        '_kind': 0,
                                        'entity': 'linkedClusters'
                                    },
                                    'ref': 'cluster_label'
                                },
                                'right': {
                                    '_kind': 17,
                                    'type': {
                                        'underlyingType': 1,
                                        'category': null
                                    },
                                    'value': 'Trump Lets Hillary Off The Hook For E-Mails And Corruption',
                                    'valueEncoded': '\'Trump Lets Hillary Off The Hook For E-Mails And Corruption\''
                                }
                            },
                            '_key': {}
                        },
                        'values': [
                            {
                                'value': 3
                            }
                        ]
                    },
                    {
                        'level': 0,
                        'levelValues': [
                            {
                                'levelSourceIndex': 0,
                                'value': 'Trump skips press, outlines first 100 days on YouTube'
                            }
                        ],
                        'value': 'Trump skips press, outlines first 100 days on YouTube',
                        'identity': {
                            '_expr': {
                                '_kind': 13,
                                'comparison': 0,
                                'left': {
                                    '_kind': 2,
                                    'source': {
                                        '_kind': 0,
                                        'entity': 'linkedClusters'
                                    },
                                    'ref': 'cluster_label'
                                },
                                'right': {
                                    '_kind': 17,
                                    'type': {
                                        'underlyingType': 1,
                                        'category': null
                                    },
                                    'value': 'Trump skips press, outlines first 100 days on YouTube',
                                    'valueEncoded': '\'Trump skips press, outlines first 100 days on YouTube\''
                                }
                            },
                            '_key': {}
                        },
                        'values': [
                            {
                                'value': 8
                            }
                        ]
                    },
                    {
                        'level': 0,
                        'levelValues': [
                            {
                                'levelSourceIndex': 0,
                                'value': 'Trump tells New York Times he doesn\'t want to \'hurt the Clintons\''
                            }
                        ],
                        'value': 'Trump tells New York Times he doesn\'t want to \'hurt the Clintons\'',
                        'identity': {
                            '_expr': {
                                '_kind': 13,
                                'comparison': 0,
                                'left': {
                                    '_kind': 2,
                                    'source': {
                                        '_kind': 0,
                                        'entity': 'linkedClusters'
                                    },
                                    'ref': 'cluster_label'
                                },
                                'right': {
                                    '_kind': 17,
                                    'type': {
                                        'underlyingType': 1,
                                        'category': null
                                    },
                                    'value': 'Trump tells New York Times he doesn\'t want to \'hurt the Clintons\'',
                                    'valueEncoded': '\'Trump tells New York Times he doesn\'\'t want to \'\'hurt the Clintons\'\'\''
                                }
                            },
                            '_key': {}
                        },
                        'values': [
                            {
                                'value': 1
                            }
                        ]
                    },
                    {
                        'level': 0,
                        'levelValues': [
                            {
                                'levelSourceIndex': 0,
                                'value': 'Trump&#8217;s big agenda could put GOP&#8217;s budget goals out of reach'
                            }
                        ],
                        'value': 'Trump&#8217;s big agenda could put GOP&#8217;s budget goals out of reach',
                        'identity': {
                            '_expr': {
                                '_kind': 13,
                                'comparison': 0,
                                'left': {
                                    '_kind': 2,
                                    'source': {
                                        '_kind': 0,
                                        'entity': 'linkedClusters'
                                    },
                                    'ref': 'cluster_label'
                                },
                                'right': {
                                    '_kind': 17,
                                    'type': {
                                        'underlyingType': 1,
                                        'category': null
                                    },
                                    'value': 'Trump&#8217;s big agenda could put GOP&#8217;s budget goals out of reach',
                                    'valueEncoded': '\'Trump&#8217;s big agenda could put GOP&#8217;s budget goals out of reach\''
                                }
                            },
                            '_key': {}
                        },
                        'values': [
                            {
                                'value': 6
                            }
                        ]
                    },
                    {
                        'level': 0,
                        'levelValues': [
                            {
                                'levelSourceIndex': 0,
                                'value': 'Trump, Trauma and the Triumph of Hate'
                            }
                        ],
                        'value': 'Trump, Trauma and the Triumph of Hate',
                        'identity': {
                            '_expr': {
                                '_kind': 13,
                                'comparison': 0,
                                'left': {
                                    '_kind': 2,
                                    'source': {
                                        '_kind': 0,
                                        'entity': 'linkedClusters'
                                    },
                                    'ref': 'cluster_label'
                                },
                                'right': {
                                    '_kind': 17,
                                    'type': {
                                        'underlyingType': 1,
                                        'category': null
                                    },
                                    'value': 'Trump, Trauma and the Triumph of Hate',
                                    'valueEncoded': '\'Trump, Trauma and the Triumph of Hate\''
                                }
                            },
                            '_key': {}
                        },
                        'values': [
                            {
                                'value': 3
                            }
                        ]
                    }
                ],
                'childIdentityFields': [
                    {
                        '_kind': 2,
                        'source': {
                            '_kind': 0,
                            'entity': 'linkedClusters'
                        },
                        'ref': 'cluster_label'
                    }
                ]
            },
            'levels': [
                {
                    'sources': [
                        {
                            'displayName': '',
                            'index': 0,
                            'type': {
                                'underlyingType': 0,
                                'category': null
                            },
                            'identityExprs': [
                                {
                                    '_kind': 2,
                                    'source': {
                                        '_kind': 0,
                                        'entity': 'linkedClusters'
                                    },
                                    'ref': 'cluster_label'
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        'columns': {
            'root': {
                'children': [
                    {
                        'level': 0
                    }
                ]
            },
            'levels': [
                {
                    'sources': [
                        {
                            'displayName': '',
                            'index': 1,
                            'type': {
                                'underlyingType': 0,
                                'category': null
                            },
                            'isMeasure': true,
                            'aggregates': {
                                'minLocal': 1,
                                'maxLocal': 8
                            }
                        }
                    ]
                }
            ]
        },
        'valueSources': [
            {
                'displayName': '',
                'index': 1,
                'type': {
                    'underlyingType': 0,
                    'category': null
                },
                'isMeasure': true,
                'aggregates': {
                    'minLocal': 1,
                    'maxLocal': 8
                }
            }
        ]
    }
};