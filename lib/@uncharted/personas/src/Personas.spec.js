/**
 * Copyright (c) 2017 Uncharted Software Inc.
 * http://www.uncharted.software/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const data = {
    personas:[
        {
            id: 'test',
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
                'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
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
    ],
};
