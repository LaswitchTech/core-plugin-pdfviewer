builder.add('components','pdfviewer', class extends builder.ComponentClass {

    _pdf = null;
    _page = null;
    _pageNum = 0;
    _numPages = 0;
    _pageRendering = false;
    _pageRendered = 0;
    _pageNumPending = null;
    _scale = 1;
    _viewport = null;
    _canvas = null;
    _context = null;
    _initialized = false;
    _presets = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4, 5];
    _verticalScroll = false;
    _renderText = false;

    _init(){

        // Set Properties
        this._properties = {
            class: {
                component: null,
            },
            filename: null,
            url: null,
            password: null,
            pageNum: 1,
            scale: 0.8,
            verticalScroll: false,
            renderText: false,
            smallToolbar: false,
        };

        // Set Protected Properties
        this._outputScale = window.devicePixelRatio || 1;

        // Configure PDF.js
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/plugins/pdfviewer/assets/js/pdfjs/build/pdf.worker.mjs';
    }

    _create(){

        // Set Self
        const self = this;

        // Return Promise
        return new Promise((resolve) => {

            // Create Component
            this._component = $(document.createElement('div')).attr({
                'id': 'viewer' + this._id,
                'class': 'pdfviewer w-100 h-100 rounded border-0 position-relative d-flex flex-column justify-content-center align-items-center',
                'style': 'transition: all 400ms ease; background-color: var(--bs-tertiary-bg);',
            });
            this._component.id = this._component.attr('id');

            // Set Component Class
            if(this._properties.class.component){
                this._component.addClass(this._properties.class.component);
            }

            // Create Viewer Toolbar
            this._component.toolbar = $(document.createElement('div')).attr({
                'class': 'position-sticky shadow border-bottom top-0 start-0 w-100 p-2 d-flex justify-content-between align-items-center rounded-top',
                'style': 'background-color: var(--bs-body-bg);',
            }).appendTo(this._component);

            // Set Component Class
            if(this._properties.class.toolbar){
                this._component.toolbar.addClass(this._properties.class.toolbar);
            }

            // Create Viewer Toolbar Buttons
            this._component.toolbar.pagination = $(document.createElement('div')).attr({
                class: 'w-auto d-flex',
            }).appendTo(this._component.toolbar);
            this._component.toolbar.buttons = $(document.createElement('div')).attr({
                class: 'input-group w-auto border rounded me-2',
            }).appendTo(this._component.toolbar.pagination);

            // Create Previous Button
            this._component.toolbar.buttons.prev = $(document.createElement('button')).attr({
                class: 'btn',
            }).html('<i class="bi bi-chevron-up"></i>').appendTo(this._component.toolbar.buttons);

            // Set Previous Button
            this._component.toolbar.buttons.prev.on('click', function(){

                // Load Previous Page
                if(self._pageNum > 1){

                    // Load Previous Page
                    self.queue(self._pageNum - 1);
                }
            });

            // Create Current Page of Total Pages
            this._component.toolbar.buttons.current = $(document.createElement('span')).attr({
                class: 'input-group-text border-0',
            }).appendTo(this._component.toolbar.buttons);

            // Create Next Button
            this._component.toolbar.buttons.next = $(document.createElement('button')).attr({
                class: 'btn rounded-end',
            }).html('<i class="bi bi-chevron-down"></i>').appendTo(this._component.toolbar.buttons);

            // Set Next Button
            this._component.toolbar.buttons.next.on('click', function(){

                // Load Next Page
                if(self._pageNum < self._numPages){

                    // Load Next Page
                    self.queue(self._pageNum + 1);
                }
            });

            // Create Vertical Scroll Button
            this._component.toolbar.buttons.verticalScroll = $(document.createElement('button')).attr({
                class: 'btn rounded border',
            }).html('<i class="bi bi-distribute-vertical"></i>').appendTo(this._component.toolbar.pagination);

            // Set Vertical Scroll Button
            this._component.toolbar.buttons.verticalScroll.on('click', function(){

                // Toggle Vertical Scroll
                self._verticalScroll = !self._verticalScroll;

                // Reload Page
                self.queue(self._pageNum);
            });

            // Set Button States Function
            this._component.toolbar.buttons.reload = function(){

                // Remove all states
                self._component.toolbar.buttons.prev.removeClass('btn-light btn-secondary')
                self._component.toolbar.buttons.next.removeClass('btn-light btn-secondary')
                self._component.toolbar.buttons.verticalScroll.removeClass('btn-light btn-secondary')

                // Set Previous Button State
                if(self._pageNum > 1){
                    self._component.toolbar.buttons.prev.addClass('btn-light');
                } else {
                    self._component.toolbar.buttons.prev.addClass('btn-secondary');
                }

                // Set Next Button State
                if(self._pageNum == self._numPages){
                    self._component.toolbar.buttons.next.addClass('btn-secondary');
                } else {
                    self._component.toolbar.buttons.next.addClass('btn-light');
                }

                // Set Vertical Scroll Button State
                if(self._verticalScroll){
                    self._component.toolbar.buttons.verticalScroll.addClass('btn-light');
                } else {
                    self._component.toolbar.buttons.verticalScroll.addClass('btn-secondary');
                }

                // Update Current Page of Total Pages
                self._component.toolbar.buttons.current.text(self._pageNum + ' of ' + self._numPages);
            }

            // Create Viewer Toolbar Zoom
            this._component.toolbar.zoom = $(document.createElement('div')).attr({
                class: 'input-group w-auto border rounded',
            }).appendTo(this._component.toolbar);

            // Create Zoom Out Button
            this._component.toolbar.zoom.out = $(document.createElement('button')).attr({
                class: 'btn',
            }).html('<i class="bi bi-dash-lg"></i>').appendTo(this._component.toolbar.zoom);

            // Set Zoom Out Button
            this._component.toolbar.zoom.out.on('click', function(){
                if(self._scale <= 1){
                    self.scale(self._scale - 0.1);
                } else {
                    if(self._scale > 2){
                        self.scale(self._scale - 1);
                    } else {
                        self.scale(self._scale - 0.25);
                    }
                }
            });

            // Create Zoom Preset
            this._component.toolbar.zoom.preset = $(document.createElement('select')).attr({
                class: 'form-select border-0',
            }).appendTo(this._component.toolbar.zoom);

            // Set Zoom Preset
            this._component.toolbar.zoom.preset.on('change', function(){
                self.scale($(this).val());
            });

            // Create Zoom In Button
            this._component.toolbar.zoom.in = $(document.createElement('button')).attr({
                class: 'btn',
            }).html('<i class="bi bi-plus-lg"></i>').appendTo(this._component.toolbar.zoom);

            // Set Zoom In Button
            this._component.toolbar.zoom.in.on('click', function(){
                if(self._scale < 1){
                    self.scale(self._scale + 0.1);
                } else {
                    if(self._scale >= 2){
                        self.scale(self._scale + 1);
                    } else {
                        self.scale(self._scale + 0.25);
                    }
                }
            });

            // Set Zoom States Function
            this._component.toolbar.zoom.reload = function(){

                // Remove all states
                self._component.toolbar.zoom.out.removeClass('btn-light btn-secondary')
                self._component.toolbar.zoom.in.removeClass('btn-light btn-secondary')

                // Set Minus Button State
                if(self._scale > 0.1){
                    self._component.toolbar.zoom.out.addClass('btn-light');
                } else {
                    self._component.toolbar.zoom.out.addClass('btn-secondary');
                }

                // Set Plus Button State
                if(self._scale < 10){
                    self._component.toolbar.zoom.in.addClass('btn-light');
                } else {
                    self._component.toolbar.zoom.in.addClass('btn-secondary');
                }

                // Clear all presets
                self._component.toolbar.zoom.preset.find('option').remove();

                // Create a new ascending array with the presets and the current scale
                let presets = [];
                for(const preset of self._presets){
                    presets.push(preset);
                }
                presets.push(self._scale);
                presets.sort((a, b) => a - b);

                // Add Presets
                for(const preset of presets){

                    // Create Option
                    let option = $(document.createElement('option')).attr({value: preset}).text((preset * 100) + "%").appendTo(self._component.toolbar.zoom.preset);

                    // Set Selected
                    if(preset == self._scale){
                        option.attr('selected', 'selected');
                    }
                }

                // Set Preset
                self._component.toolbar.zoom.preset.val(self._scale);
            }

            // Create Viewer Toolbar Actions
            this._component.toolbar.actions = $(document.createElement('div')).attr({
                class: 'input-group w-auto border rounded',
            }).appendTo(this._component.toolbar);

            // Check if renderText is enabled
            if(this._renderText){

                // Create Search Button
                this._component.toolbar.actions.search = $(document.createElement('button')).attr({
                    class: 'btn btn-teal',
                }).html('<i class="bi bi-search"></i>').appendTo(this._component.toolbar.actions);
            }

            // Create Print Button
            this._component.toolbar.actions.print = $(document.createElement('button')).attr({
                class: 'btn btn-light',
            }).html('<i class="bi bi-printer"></i>').appendTo(this._component.toolbar.actions);

            // Set Print Button Action
            this._component.toolbar.actions.print.on('click', function () {
                self._print();
            });

            // Create Download Button
            this._component.toolbar.actions.download = $(document.createElement('button')).attr({
                class: 'btn btn-light',
            }).html('<i class="bi bi-download"></i>').appendTo(this._component.toolbar.actions);

            // Set Download Button Action
            this._component.toolbar.actions.download.on('click', function () {
                self._download();
            });

            // Create Properties Button
            this._component.toolbar.actions.properties = $(document.createElement('button')).attr({
                class: 'btn btn-info',
            }).html('<i class="bi bi-info-circle"></i>').appendTo(this._component.toolbar.actions);

            // Set Properties Button Action
            this._component.toolbar.actions.properties.on('click', function () {
                self._info();
            });

            // Check if the toolbar should be small
            if(this._properties.smallToolbar){
                this._component.toolbar.buttons.addClass('input-group-sm');
                this._component.toolbar.zoom.addClass('input-group-sm');
                this._component.toolbar.actions.addClass('input-group-sm');
            }

            // Create a spinner animate-rotate
            this._component.spinner = $(document.createElement('div')).attr({
                "class": "animate-rotate rounded-circle border border-secondary border-4 my-5",
                "style": "width: 96px; height: 96px; border-top-color: var(--bs-primary)!important;",
            }).appendTo(this._component);

            // Create a Container for the Canvas
            this._component.container = $(document.createElement('div')).attr({
                class: 'w-100 position-relative text-center overflow-auto rounded-bottom',
                style: 'transition: all 400ms ease; max-height: calc(100vh - 100px);',
            }).appendTo(this._component);

            // Resolve the promise
            resolve(this._component);
        });
    }

    _load(){

        // Set Self
        const self = this;

        // Load the PDF
        pdfjsLib.getDocument({ url:this._properties.url, password:this._properties.password })
            .promise.then(function(pdfDoc) {

                // Hide Spinner
                self._component.spinner.hide();

                // Set PDF
                self._pdf = pdfDoc;

                // Store total number of pages
                self._numPages = pdfDoc.numPages;

                // Set Custom Properties
                self._scale = self._properties.scale;
                self._verticalScroll = self._properties.verticalScroll;
                self._renderText = self._properties.renderText;

                // Queue the selected page
                self.queue(self._properties.pageNum);
            }).catch(error => {

                // Log Error
                console.error('Error loading PDF:', error.message);
            });
    }

    _isInitialized(){
        if(!this._initialized){
            if(typeof this._component.container.length !== 'undefined'){
                this._initialized = true;
                // this._canvas = this._component.find('canvas').first();
                // this._context = this._canvas[0].getContext('2d');
            }
        }
        return this._initialized;
    }

    _wait(){

        // Set Self
        const self = this;

        // Return a Promise that resolves once _initialized is true
        return new Promise((resolve, reject) => {
            const checkInitialization = () => {
                if (self._isInitialized()) {
                    resolve();
                } else {
                    // Retry after a short delay
                    setTimeout(checkInitialization, 50);
                }
            };

            // Start checking
            checkInitialization();
        });
    }

    scale(scale){

        // Set Self
        const self = this;

        // Set Scale
        if(scale){

            // Convert scale to a number
            scale = parseFloat(scale);

            // Make sure the scale is a number with max 2 decimals
            scale = parseFloat(scale.toFixed(2));

            // Set Scale
            this._scale = scale;
        }

        // Check if the scale is out of range (0.1 - 10)
        if(this._scale < 0.1){
            this._scale = 0.1;
        } else if(this._scale > 5){
            this._scale = 5;
        }

        // Queue the current page
        this.queue(this._pageNum);

        return this._scale;
    }

    queue(num){

        // Set Self
        const self = this;

        this._wait().then(() => {

            // Check if the page is already being rendered
            if (this._pageRendering) {

                // Set the page number to be rendered when the rendering is done
                this._pageNumPending = num;
            } else {

                // Render the page
                this._render(num);
            }
        }).catch((error) => {
            console.error('Error while waiting for initialization:', error);
        });
    }

    _render(pageNum){

        // Set Self
        const self = this;

        // Set Page Number
        this._pageNum = pageNum;

        // Set Page Rendering
        this._pageRendering = true;

        // Reload Toolbar
        this._component.toolbar.zoom.reload();

        // Clear all previous rendered objects
        this._component.container.find('canvas').remove();
        this._component.container.find('br').remove();

        // Reset _pageRendered to 0
        this._pageRendered = 0;

        // Create an array of pages to render
        let pages = [];
        if(this._verticalScroll){
            for(let i = 0; i < this._numPages; i++){
                pages.push(i + 1);
            }
        } else {
            pages.push(this._pageNum);
        }

        // Render the pages
        for(const num of pages){
            this._renderPage(num).then((canvas) => {

                // Check if all pages are rendered
                if(self._pageRendered == pages.length){

                    // Reload Toolbar
                    self._component.toolbar.buttons.reload();

                    // Scroll to the current page
                    if(self._verticalScroll){
                        self._component.container.scrollTop(self._component.container.find('canvas').eq(self._pageNum - 1).position().top);
                    }

                    // Set Page Rendering
                    self._pageRendering = false;

                    // Check if another page rendering was requested
                    if(self._pageNumPending !== null){

                        // Render the pending page
                        self._render(self._pageNumPending);
                        self._pageNumPending = null;
                    }
                }
            });
        }
    }

    _renderPage(num){

        // Set Self
        const self = this;

        // Return Promise
        return new Promise((resolve) => {

            // Render the page
            self._pdf.getPage(num).then(page => {

                // Set Viewport
                let viewport = page.getViewport({ scale: self._scale });

                // Create a Canvas
                let canvas = $(document.createElement('canvas')).attr({
                    class: 'm-2',
                }).appendTo(self._component.container);

                // Append a <br> if the vertical scroll is enabled
                if(self._verticalScroll){
                    self._component.container.append('<br>');
                }

                // Set Canvas
                canvas[0].height = Math.floor(viewport.height);
                canvas[0].width = Math.floor(viewport.width);
                canvas[0].style.height = Math.floor(viewport.height) + "px";
                canvas[0].style.width = Math.floor(viewport.width) + "px";

                // Set Context
                let context = canvas[0].getContext('2d');

                // Render the page
                const render = page.render({
                    canvasContext: context,
                    viewport: viewport
                });
                render.promise.then(() => {

                    // Check if text should be rendered
                    if(self._renderText){

                        // Render the text
                        page.getTextContent().then(textContent => {

                            // Set Text Layer
                            const textLayer = $(document.createElement('div')).attr({
                                class: 'textLayer',
                                style: `
                                    position: absolute;
                                    top: ${canvas.position().top}px;
                                    left: ${canvas.position().left}px;
                                    height: ${canvas[0].style.height};
                                    width: ${canvas[0].style.width};
                                    z-index: 2;
                                `,
                            }).appendTo(self._component.container);

                            self._renderTextLayer(textContent, textLayer[0], viewport).then(() => {

                                // Incerement the rendered pages
                                self._pageRendered++;

                                // Resolve the promise
                                resolve(canvas);
                            });
                        });
                    } else {

                        // Incerement the rendered pages
                        self._pageRendered++;

                        // Resolve the promise
                        resolve(canvas);
                    }
                });
            });
        });
    }

    _renderTextLayer(textContent, container, viewport) {
        return new Promise((resolve) => {

            // Clear existing content
            container.textContent = '';

            // Transform text items to their viewport positions
            const transformTextItem = (item) => {
                const transform = pdfjsLib.Util.transform(
                    pdfjsLib.Util.transform(viewport.transform, item.transform),
                    [1, 0, 0, -1, 0, 0]
                );

                return {
                    transform,
                    width: item.width * viewport.scale,
                    height: item.height * viewport.scale,
                    fontSize: item.fontSize * viewport.scale,
                    text: item.str,
                };
            };

            // Render each text item
            textContent.items.forEach((item) => {
                const { transform, width, height, fontSize, text } = transformTextItem(item);

                // Create a span for the text
                const span = document.createElement('span');
                span.textContent = text;
                span.style.position = 'absolute';
                span.style.left = `${transform[4]}px`;
                span.style.top = `${transform[5] - height}px`;
                span.style.fontSize = `${fontSize}px`;
                span.style.transform = `matrix(${transform[0]}, ${transform[1]}, ${transform[2]}, ${transform[3]}, 0, 0)`;
                span.style.whiteSpace = 'pre';
                container.appendChild(span);
            });

            resolve();
        });
    }

    _print() {

        // Set Self
        const self = this;

        // Create a hidden iframe
        const printIframe = document.createElement('iframe');
        printIframe.style.position = 'absolute';
        printIframe.style.top = '-9999px';
        printIframe.style.left = '-9999px';
        document.body.appendChild(printIframe);

        // Render all pages and prepare for printing
        const doc = printIframe.contentDocument || printIframe.contentWindow.document;
        const body = doc.body;

        body.style.margin = '0';
        body.style.padding = '0';

        const LETTER_WIDTH = 816;  // Letter size width in pixels
        const LETTER_HEIGHT = 1056; // Letter size height in pixels

        const renderAllPages = async () => {
            for (let i = 1; i <= self._numPages; i++) {
                const page = await self._pdf.getPage(i);
                const viewport = page.getViewport({ scale: 1 });

                // Create a canvas for each page
                const canvas = document.createElement('canvas');
                const scale = Math.min(LETTER_WIDTH / viewport.width, LETTER_HEIGHT / viewport.height);
                canvas.width = viewport.width * scale;
                canvas.height = viewport.height * scale;

                const context = canvas.getContext('2d');
                const scaledViewport = page.getViewport({ scale });
                await page.render({ canvasContext: context, viewport: scaledViewport }).promise;

                // Add the canvas as an image to the iframe
                const img = new Image();
                img.src = canvas.toDataURL();
                img.style.pageBreakAfter = 'always';
                img.style.width = `${LETTER_WIDTH}px`;
                img.style.height = `${LETTER_HEIGHT}px`;
                img.style.margin = '0 auto';
                img.style.display = 'block';
                body.appendChild(img);
            }
        };

        renderAllPages().then(() => {
            // Remove default browser print header/footer
            const style = doc.createElement('style');
            style.innerHTML = `
                @page {
                    margin: 0;
                }
                body {
                    margin: 0;
                    padding: 0;
                }
            `;
            doc.head.appendChild(style);

            // Wait for the images to load and trigger print
            setTimeout(() => {
                printIframe.contentWindow.print();
                document.body.removeChild(printIframe);
            }, 1000);
        });
    }

    _download(){

        // Set Self
        const self = this;

        // Check if the URL is defined
        if (!this._properties.url) {
            console.error("No URL provided for download.");
            return;
        }

        // Create a temporary <a> element
        const link = document.createElement('a');
        link.href = this._properties.url;

        // Set the download attribute to suggest a filename (optional)
        const urlParts = this._properties.url.split('/');
        link.download = self._properties.filename || (urlParts[urlParts.length - 1] || 'download.pdf');

        // Append the link to the document, trigger click, and remove it
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    _info(){

        // Set Self
        const self = this;

        // Create a modal
        return this._builder.Component(
            'modal',
            {
                icon: 'info-circle',
                title: 'Document Properties',
                submit: false,
                color: 'info',
            },
            function(modal, component){

                // Remove padding from the body
                component.body.addClass('p-0 text-bg-dark');

                // Fetch metadata
                self._pdf.getMetadata()
                    .then((metadata) => {
                        console.log("Metadata:", metadata);

                        // Build the properties object
                        const properties = {
                            "File name": self._properties.url || "-",
                            "File size": metadata?.contentLength || 0,
                            "Title": metadata.info?.Title || "-",
                            "Author": metadata.info?.Author || "-",
                            "Subject": metadata.info?.Subject || "-",
                            "Keywords": metadata.info?.Keywords || "-",
                            "Created": metadata.info?.CreationDate || "-",
                            "Modified": metadata.info?.ModDate || "-",
                            "Application": metadata.info?.Creator || "-",
                            "PDF Producer": metadata.info?.Producer || "-",
                            "PDF Version": metadata.info?.PDFFormatVersion || "-",
                            "Page count": self._numPages || "-",
                        };

                        // Retrieve the file name from the url
                        const urlParts = self._properties.url.split('/');
                        properties["File name"] = self._properties.filename || (urlParts[urlParts.length - 1] || "download.pdf");

                        // Convert the file size to a human-readable format
                        let fileSize = properties["File size"];
                        const units = ["B", "KB", "MB", "GB", "TB"];
                        let unit = 0;
                        while (fileSize > 1024) {
                            fileSize /= 1024;
                            unit++;
                        }
                        properties["File size"] = `${fileSize.toFixed(2)} ${units[unit]}`;

                        // Convert the dates to a human-readable format
                        properties["Created"] = self._parseDate(properties["Created"]);
                        properties["Modified"] = self._parseDate(properties["Modified"]);

                        // Create a list group
                        component.body.list = $(document.createElement('ul')).attr({
                            class: 'list-group list-group-flush bg-transparent',
                        }).appendTo(component.body);

                        // Add each property to the list group
                        for (const [key, value] of Object.entries(properties)) {
                            const item = $(document.createElement('li')).attr({
                                class: 'list-group-item',
                            }).html(`${key}: <span class="float-end">${value}</span>`).appendTo(component.body.list);
                        }

                        // Show the modal
                        modal.show();
                    })
                    .catch((error) => {
                        console.error("Error fetching PDF properties:", error);
                    });
            },
        );
    }

    _parseDate(pdfDate) {
        // Check if the date starts with "D:"
        if (pdfDate.startsWith("D:")) {
            pdfDate = pdfDate.substring(2); // Remove "D:"
        }

        // Extract components using regex
        const match = pdfDate.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})([+-Z])?(\d{2})?'?(\d{2})?'?/);
        if (!match) {
            return "Invalid Date";
        }

        const [
            ,
            year,
            month,
            day,
            hour,
            minute,
            second,
            offsetSign,
            offsetHour,
            offsetMinute,
        ] = match;

        // Create a UTC date
        const date = new Date(
            Date.UTC(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day),
                parseInt(hour),
                parseInt(minute),
                parseInt(second)
            )
        );

        // Apply timezone offset if present
        if (offsetSign === "+" || offsetSign === "-") {
            const offsetInMinutes =
                parseInt(offsetHour || "0") * 60 + parseInt(offsetMinute || "0");
            const signMultiplier = offsetSign === "+" ? -1 : 1; // Reverse offset for UTC
            date.setUTCMinutes(date.getUTCMinutes() + signMultiplier * offsetInMinutes);
        }

        // Return the date in local timezone as a readable string
        return date.toLocaleString();
    }
});
