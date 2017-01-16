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
                    'name': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
                    'values': [
                        {
                            'value': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit'
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
                                'value': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
                                'valueEncoded': '\'Lorem ipsum dolor sit amet, consectetur adipiscing elit\''
                            }
                        },
                        '_key': {}
                    }
                },
                {
                    'name': 'Nam congue erat nulla, at lobortis velit efficitur eget',
                    'values': [
                        {
                            'value': 'Nam congue erat nulla, at lobortis velit efficitur eget'
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
                                'value': 'Nam congue erat nulla, at lobortis velit efficitur eget',
                                'valueEncoded': '\'Nam congue erat nulla, at lobortis velit efficitur eget\''
                            }
                        },
                        '_key': {}
                    }
                },
                {
                    'name': 'Pellentesque sit amet ante mattis, dignissim nisi et, efficitur nisi',
                    'values': [
                        {
                            'value': 'Pellentesque sit amet ante mattis, dignissim nisi et, efficitur nisi'
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
                                'value': 'Pellentesque sit amet ante mattis, dignissim nisi et, efficitur nisi',
                                'valueEncoded': '\'Pellentesque sit amet ante mattis, dignissim nisi et, efficitur nisi\''
                            }
                        },
                        '_key': {}
                    }
                },
                {
                    'name': 'Nunc vitae sapien eget arcu egestas viverra eu vitae metus',
                    'values': [
                        {
                            'value': 'Nunc vitae sapien eget arcu egestas viverra eu vitae metus'
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
                                'value': 'Nunc vitae sapien eget arcu egestas viverra eu vitae metus',
                                'valueEncoded': '\'Nunc vitae sapien eget arcu egestas viverra eu vitae metus\''
                            }
                        },
                        '_key': {}
                    }
                },
                {
                    'name': 'Cras et tincidunt nunc. Suspendisse vitae feugiat justo, sed malesuada est',
                    'values': [
                        {
                            'value': 'Cras et tincidunt nunc. Suspendisse vitae feugiat justo, sed malesuada est'
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
                                'value': 'Cras et tincidunt nunc. Suspendisse vitae feugiat justo, sed malesuada est',
                                'valueEncoded': '\'Cras et tincidunt nunc. Suspendisse vitae feugiat justo, sed malesuada est\''
                            }
                        },
                        '_key': {}
                    }
                },
                {
                    'name': 'Morbi enim leo, euismod porttitor risus nec, auctor pellentesque leo',
                    'values': [
                        {
                            'value': 'Morbi enim leo, euismod porttitor risus nec, auctor pellentesque leo'
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
                                'value': 'Morbi enim leo, euismod porttitor risus nec, auctor pellentesque leo',
                                'valueEncoded': '\'Morbi enim leo, euismod porttitor risus nec, auctor pellentesque leo\''
                            }
                        },
                        '_key': {}
                    }
                },
                {
                    'name': 'Mauris volutpat commodo nisi eu rutrum',
                    'values': [
                        {
                            'value': 'Mauris volutpat commodo nisi eu rutrum'
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
                                'value': 'Mauris volutpat commodo nisi eu rutrum',
                                'valueEncoded': '\'Mauris volutpat commodo nisi eu rutrum\''
                            }
                        },
                        '_key': {}
                    }
                },
                {
                    'name': 'Etiam molestie congue nibh id rhoncus',
                    'values': [
                        {
                            'value': 'Etiam molestie congue nibh id rhoncus'
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
                                'value': 'Etiam molestie congue nibh id rhoncus',
                                'valueEncoded': '\'Etiam molestie congue nibh id rhoncus\''
                            }
                        },
                        '_key': {}
                    }
                },
                {
                    'name': 'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas',
                    'values': [
                        {
                            'value': 'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas'
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
                                'value': 'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas',
                                'valueEncoded': '\'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas\''
                            }
                        },
                        '_key': {}
                    }
                },
                {
                    'name': 'Maecenas ut dolor posuere, tempor dolor nec, mattis ex',
                    'values': [
                        {
                            'value': 'Maecenas ut dolor posuere, tempor dolor nec, mattis ex'
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
                                'value': 'Maecenas ut dolor posuere, tempor dolor nec, mattis ex',
                                'valueEncoded': '\'Maecenas ut dolor posuere, tempor dolor nec, mattis ex\''
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
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
                1
            ],
            [
                'Nam congue erat nulla, at lobortis velit efficitur eget',
                1
            ],
            [
                'Pellentesque sit amet ante mattis, dignissim nisi et, efficitur nisi',
                5
            ],
            [
                'Nunc vitae sapien eget arcu egestas viverra eu vitae metus',
                7
            ],
            [
                'Cras et tincidunt nunc. Suspendisse vitae feugiat justo, sed malesuada est',
                1
            ],
            [
                'Morbi enim leo, euismod porttitor risus nec, auctor pellentesque leo',
                3
            ],
            [
                'Mauris volutpat commodo nisi eu rutrum',
                8
            ],
            [
                'Etiam molestie congue nibh id rhoncus',
                1
            ],
            [
                'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas',
                6
            ],
            [
                'Maecenas ut dolor posuere, tempor dolor nec, mattis ex',
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
                        'value': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
                        'valueEncoded': '\'Lorem ipsum dolor sit amet, consectetur adipiscing elit\''
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
                        'value': 'Nam congue erat nulla, at lobortis velit efficitur eget',
                        'valueEncoded': '\'Nam congue erat nulla, at lobortis velit efficitur eget\''
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
                        'value': 'Pellentesque sit amet ante mattis, dignissim nisi et, efficitur nisi',
                        'valueEncoded': '\'Pellentesque sit amet ante mattis, dignissim nisi et, efficitur nisi\''
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
                        'value': 'Nunc vitae sapien eget arcu egestas viverra eu vitae metus',
                        'valueEncoded': '\'Nunc vitae sapien eget arcu egestas viverra eu vitae metus\''
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
                        'value': 'Cras et tincidunt nunc. Suspendisse vitae feugiat justo, sed malesuada est',
                        'valueEncoded': '\'Cras et tincidunt nunc. Suspendisse vitae feugiat justo, sed malesuada est\''
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
                        'value': 'Morbi enim leo, euismod porttitor risus nec, auctor pellentesque leo',
                        'valueEncoded': '\'Morbi enim leo, euismod porttitor risus nec, auctor pellentesque leo\''
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
                        'value': 'Mauris volutpat commodo nisi eu rutrum',
                        'valueEncoded': '\'Mauris volutpat commodo nisi eu rutrum\''
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
                        'value': 'Etiam molestie congue nibh id rhoncus',
                        'valueEncoded': '\'Etiam molestie congue nibh id rhoncus\''
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
                        'value': 'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas',
                        'valueEncoded': '\'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas\''
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
                        'value': 'Maecenas ut dolor posuere, tempor dolor nec, mattis ex',
                        'valueEncoded': '\'Maecenas ut dolor posuere, tempor dolor nec, mattis ex\''
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
                                'value': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit'
                            }
                        ],
                        'value': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
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
                                    'value': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
                                    'valueEncoded': '\'Lorem ipsum dolor sit amet, consectetur adipiscing elit\''
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
                                'value': 'Nam congue erat nulla, at lobortis velit efficitur eget'
                            }
                        ],
                        'value': 'Nam congue erat nulla, at lobortis velit efficitur eget',
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
                                    'value': 'Nam congue erat nulla, at lobortis velit efficitur eget',
                                    'valueEncoded': '\'Nam congue erat nulla, at lobortis velit efficitur eget\''
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
                                'value': 'Pellentesque sit amet ante mattis, dignissim nisi et, efficitur nisi'
                            }
                        ],
                        'value': 'Pellentesque sit amet ante mattis, dignissim nisi et, efficitur nisi',
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
                                    'value': 'Pellentesque sit amet ante mattis, dignissim nisi et, efficitur nisi',
                                    'valueEncoded': '\'Pellentesque sit amet ante mattis, dignissim nisi et, efficitur nisi\''
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
                                'value': 'Nunc vitae sapien eget arcu egestas viverra eu vitae metus'
                            }
                        ],
                        'value': 'Nunc vitae sapien eget arcu egestas viverra eu vitae metus',
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
                                    'value': 'Nunc vitae sapien eget arcu egestas viverra eu vitae metus',
                                    'valueEncoded': '\'Nunc vitae sapien eget arcu egestas viverra eu vitae metus\''
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
                                'value': 'Cras et tincidunt nunc. Suspendisse vitae feugiat justo, sed malesuada est'
                            }
                        ],
                        'value': 'Cras et tincidunt nunc. Suspendisse vitae feugiat justo, sed malesuada est',
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
                                    'value': 'Cras et tincidunt nunc. Suspendisse vitae feugiat justo, sed malesuada est',
                                    'valueEncoded': '\'Cras et tincidunt nunc. Suspendisse vitae feugiat justo, sed malesuada est\''
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
                                'value': 'Morbi enim leo, euismod porttitor risus nec, auctor pellentesque leo'
                            }
                        ],
                        'value': 'Morbi enim leo, euismod porttitor risus nec, auctor pellentesque leo',
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
                                    'value': 'Morbi enim leo, euismod porttitor risus nec, auctor pellentesque leo',
                                    'valueEncoded': '\'Morbi enim leo, euismod porttitor risus nec, auctor pellentesque leo\''
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
                                'value': 'Mauris volutpat commodo nisi eu rutrum'
                            }
                        ],
                        'value': 'Mauris volutpat commodo nisi eu rutrum',
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
                                    'value': 'Mauris volutpat commodo nisi eu rutrum',
                                    'valueEncoded': '\'Mauris volutpat commodo nisi eu rutrum\''
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
                                'value': 'Etiam molestie congue nibh id rhoncus'
                            }
                        ],
                        'value': 'Etiam molestie congue nibh id rhoncus',
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
                                    'value': 'Etiam molestie congue nibh id rhoncus',
                                    'valueEncoded': '\'Etiam molestie congue nibh id rhoncus\''
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
                                'value': 'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas'
                            }
                        ],
                        'value': 'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas',
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
                                    'value': 'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas',
                                    'valueEncoded': '\'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas\''
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
                                'value': 'Maecenas ut dolor posuere, tempor dolor nec, mattis ex'
                            }
                        ],
                        'value': 'Maecenas ut dolor posuere, tempor dolor nec, mattis ex',
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
                                    'value': 'Maecenas ut dolor posuere, tempor dolor nec, mattis ex',
                                    'valueEncoded': '\'Maecenas ut dolor posuere, tempor dolor nec, mattis ex\''
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