
// Get canvas object
var canvas = document.querySelector('canvas');

// The random colours for triangles - Credits to clrs.cc for these colour codes
var colourArray = ['#001f3f', '#0074D9', '#7FDBFF', '#39CCCC', '#3D9970', '#2ECC40', '#01FF70', '#FFDC00', '#FF851B', '#FF4136', '#85144b', '#F012BE', '#B10DC9', '#AAAAAA', '#DDDDDD'];

// Setting canvas height and width and border
canvas.width = document.body.clientWidth;
canvas.height = document.body.clientHeight;
canvas.style.border = '5px solid black';

// Set the offset created by the border
var borderOffset = 5;

// Setting random background, h1, and button colour
var backgroundColour = colourArray[Math.floor(Math.random() * colourArray.length)];
canvas.style.background = backgroundColour;
document.getElementById('header').style.color = backgroundColour;
document.getElementById('clear').style.backgroundColor = backgroundColour;
document.getElementById('random').style.backgroundColor = backgroundColour;
document.getElementById('disco').style.backgroundColor = backgroundColour;

// Removing background colour from array so the triangle isn't the same colour as the background
var index = colourArray.indexOf(backgroundColour);
colourArray.splice(index, 1);

// Init array to store the triangles' properties for deleting, updating, etc.
var drawArray = [];

// Check if currently dragging a triangle
var dragging = false;

// Check if mouse down was inside canvas
var inCanvas = false;

// Init the canvas context
var ctxt = canvas.getContext('2d');

// Init various x,y
var xStart, yStart, xTrack, yTrack, xEnd, yEnd, xPoint, yPoint, xDrag, yDrag;

// Temp Colour
var currentColour = null;

// Drawing if possible
if (canvas.getContext) {
    // Add event listeners
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('dblclick', onDbClick);
}





function onMouseDown(e) {
    // Tell the mouse up event that mouse down was inside canvas
    inCanvas = true;

    // Set initial cursor position on mouse down, and store it in a point object
    xStart = e.clientX - canvas.offsetLeft - borderOffset;
    yStart = e.clientY - canvas.offsetTop - borderOffset;
    var p = { x : xStart, y : yStart };

    // Hit detection for dragging the triangle
    // Hit detection function returns success, and index of triangle in the array it is stored in
    var clickedTriangle = ptInTriangle(p);
    
    if(clickedTriangle.success) {

        // On hit success, splice out the triangle hit
        var triangle = drawArray.splice(clickedTriangle.index, 1);

        // Calculate the center of the triangle
        var center = { x : (triangle[0].p1.x + triangle[0].p2.x)/2, y : (triangle[0].p0.y + triangle[0].p1.y)/2 };

        // Calculate offset from center for dragging. This is done to fix the 'snapping' effect when dragging
        var offset = { x : p.x - center.x, y : p.y - center.y};

        // Push the triagle back in the array and re-render so the triangle is on top
        drawArray.push(triangle[0]);
        reRenderCanvas();

        // Track mouse movements for live x,y
        canvas.onmousemove = (m) => {

            // Set the dragging check to true
            dragging = true;

            // Get live x,y and store it in a point object
            xDrag = m.clientX - canvas.offsetLeft - borderOffset;
            yDrag = m.clientY - canvas.offsetTop - borderOffset;
            var position = { x: xDrag, y : yDrag };

            // Pop the array and use the draw function to draw the triangles as mouse moves
            drawArray.pop();
            drag(triangle[0], position, offset);
        }
        
    } else {
        // If clicked outside triangle
        // Set current colour randomly from colour array
        currentColour = colourArray[Math.floor(Math.random() * colourArray.length)];

        // Init a point as a triangle and push it into array. This will eventually stretch out to a triangle on mouse move
        var liveTriangle = { p0:p, p1:p, p2:p, colour:currentColour };
        drawArray.push(liveTriangle);
        reRenderCanvas();

        // On mouse move
        canvas.onmousemove = (m) => {
            // Set tracking x,y and store it in a point object
            xTrack = m.clientX - canvas.offsetLeft - borderOffset;
            yTrack = m.clientY - canvas.offsetTop - borderOffset;
            var position = { x: xTrack, y : yTrack };

            // Pop the array and use the live preview function to stretch out the triangle
            drawArray.pop();
            livePreview(liveTriangle, position);
        }
    }
}





function onMouseUp(e) {
    // Get final cursor position
    xEnd = e.clientX - canvas.offsetLeft - borderOffset;
    yEnd = e.clientY - canvas.offsetTop - borderOffset;

    // Check if mouse down was inside canvas
    if(inCanvas) {
        // Check whether dragging a triangle
        if(dragging) {
            // Reset dragging to false
            dragging = false;
        } else {
            // If not, check if the start and end points are the same to check if it's a click
            if(xStart!==xEnd && yStart!==yEnd) {
                // If it's not a click
                
                // Pop the array to remove the triangle created by mouse-up > mouse-move 
                drawArray.pop();
                reRenderCanvas();

                // Calc the three vertices of the equilateral triangle
                var p0 = { x : (xEnd+xStart)/2, y : yStart};
                var p1 = { x : xStart, y : yEnd};
                var p2 = { x : xEnd, y : yEnd};
    
                // Draw the triangle
                drawTriangle(p0, p1, p2, currentColour);
    
                // Push the triangle's properties into the draw array
                var obj = { p0:p0, p1:p1, p2:p2, colour:currentColour };
                drawArray.push(obj);
            } else {
                // If it's a click
                console.log('Click');
            }
        }
    } else {
        console.log('Mouse down outside canvas');
    }

    // On Mouse Up, remove Mouse Move event listener and reset inCanvas to false
    canvas.onmousemove = null;
    inCanvas = false;
}





function onDbClick(e) {
    // Get double clicked point and store it in a point object
    xPoint = e.clientX - canvas.offsetLeft - borderOffset;
    yPoint = e.clientY - canvas.offsetTop - borderOffset;
    var p = { x : xPoint , y : yPoint };

    // Hit detection returns index of hit triangle on success
    var clickedTriangle = ptInTriangle(p);

    if(clickedTriangle.success) {
        // If hit successful, delete the triangle from the array and re-render
        drawArray.splice(clickedTriangle.index, 1);
        reRenderCanvas();
    } else {
        // If hit is not successful
        console.log("No triangle there!");
    }
}





// Drag function takes a triangle vertices(p0,p1,p2), current mouse position and its offset from the center of the triangle
function drag(triangleObj, position, offset) {
    // Calculate height and width of triangle 
    var height = triangleObj.p0.y - triangleObj.p1.y;
    var width = triangleObj.p2.x - triangleObj.p1.x;

    // Using the height, width, and the offset, translate the triangle vertices according to mouse position
    triangleObj.p0.x = position.x - offset.x;
    triangleObj.p0.y = position.y + height/2 - offset.y;
    triangleObj.p1.x = position.x - width/2 - offset.x;
    triangleObj.p1.y = position.y - height/2 - offset.y;
    triangleObj.p2.x = position.x + width/2 - offset.x;
    triangleObj.p2.y = position.y - height/2 - offset.y;

    // Push triangle into array and re-render the canvas
    drawArray.push(triangleObj);
    reRenderCanvas();
}

function livePreview(triangleObj, position) {
    var p0 = { x : (position.x + xStart)/2, y : yStart};
    var p1 = { x : xStart, y : position.y};
    var p2 = { x : position.x, y : position.y};

    triangleObj.p0 = p0;
    triangleObj.p1 = p1;
    triangleObj.p2 = p2;

    // Push triangle into array and re-render the canvas
    drawArray.push(triangleObj);
    reRenderCanvas();
}





// Clear the entire canvas on clicking the clear button
function clrscr() {
    // Clear canvas
    ctxt.clearRect(0, 0, canvas.width, canvas.height);

    // Delete all elements of array
    drawArray.splice(0,drawArray.length);

    console.log("Cleared canvas!");
}





// Randomize colours
function randomize() {
    console.log("Randomizing colours!");

    // Clear canvas
    ctxt.clearRect(0, 0, canvas.width, canvas.height);

    // Looping through the array, changing colours
    for(var i = 0; i < drawArray.length; i++) {
        drawArray[i].colour = colourArray[Math.floor(Math.random() * colourArray.length)];
        drawTriangle(drawArray[i].p0, drawArray[i].p1, drawArray[i].p2, drawArray[i].colour);
    }
}




//Disco!
var interval;
function disco() {
    interval = setInterval(randomize, 333);
    document.getElementById('disco').style.display = 'none';
    document.getElementById('stop').style.display = 'block';
}

function stopDisco() {
    clearInterval(interval);
    document.getElementById('stop').style.display = 'none';
    document.getElementById('disco').style.display = 'block';
  }





// Re-rendering the canvas
function reRenderCanvas() {
    console.log("Re-rendering canvas!");

    // Clear canvas
    ctxt.clearRect(0, 0, canvas.width, canvas.height);

    // Looping through the array, draw the triangles in the correct order
    for(var i = 0; i < drawArray.length; i++) {
        drawTriangle(drawArray[i].p0, drawArray[i].p1, drawArray[i].p2, drawArray[i].colour);
    }
}





// Drawing a triangle given the 3 vertices and the colour
function drawTriangle(p0, p1, p2, colour) {
    // Draw the triangle using the canvas context
    ctxt.beginPath();
    ctxt.moveTo(p0.x, p0.y);
    ctxt.lineTo(p1.x, p1.y);
    ctxt.lineTo(p2.x, p2.y);
    ctxt.closePath();
    ctxt.fillStyle = colour;
    ctxt.fill();
}





// Hit detection given a point
function ptInTriangle(p) {

    // Init success and index
    var success = false;
    var index = null;
    
    // Core logic for hit detection taken from https://stackoverflow.com/questions/2049582/how-to-determine-if-a-point-is-in-a-2d-triangle#comment22628102_2049712 , credit to https://stackoverflow.com/users/1382949/urraka
    for(var i = drawArray.length - 1; i >= 0; i--) {
        var A = 1/2 * (-drawArray[i].p1.y * drawArray[i].p2.x + drawArray[i].p0.y * (-drawArray[i].p1.x + drawArray[i].p2.x) + drawArray[i].p0.x * (drawArray[i].p1.y - drawArray[i].p2.y) + drawArray[i].p1.x * drawArray[i].p2.y);
        var sign = A < 0 ? -1 : 1;
        var s = (drawArray[i].p0.y * drawArray[i].p2.x - drawArray[i].p0.x * drawArray[i].p2.y + (drawArray[i].p2.y - drawArray[i].p0.y) * p.x + (drawArray[i].p0.x - drawArray[i].p2.x) * p.y) * sign;
        var t = (drawArray[i].p0.x * drawArray[i].p1.y - drawArray[i].p0.y * drawArray[i].p1.x + (drawArray[i].p0.y - drawArray[i].p1.y) * p.x + (drawArray[i].p1.x - drawArray[i].p0.x) * p.y) * sign;
        if(s > 0 && t > 0 && (s + t) < 2 * A * sign) {
            // If hit successful, set success to true, index to the index of the triangle hit and break the loop
            success = true;
            index = i;
            console.log("Hit detection successful!");
            break;
        }
    }
    return { success : success, index : index };
}