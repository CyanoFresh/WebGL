'use strict';

let gl;                         // The webgl context.

let iAttribVertex;              // Location of the attribute variable in the shader program.
let iAttribTexture;             // Location of the attribute variable in the shader program.

let iColor;                     // Location of the uniform specifying a color for the primitive.
let iColorCoef;                 // Location of the uniform specifying a color for the primitive.
let iModelViewProjectionMatrix; // Location of the uniform matrix representing the combined transformation.
let iTextureMappingUnit;

let iVertexBuffer;              // Buffer to hold the values.
let iTexBuffer;                 // Buffer to hold the values.

let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.

let isFilled = false;
let eyeSeparation = 70;

let rotationMatrix = getRotationMatrix();

const R = 1;
const a = 1;
const n = 1;

const x = (r, B) => r * Math.cos(B);
const y = (r, B) => r * Math.sin(B);
const z = (r) => a * Math.cos((n * Math.PI * r) / R);


/* Draws a WebGL primitive.  The first parameter must be one of the constants
 * that specify primitives:  gl.POINTS, gl.LINES, gl.LINE_LOOP, gl.LINE_STRIP,
 * gl.TRIANGLES, gl.TRIANGLE_STRIP, gl.TRIANGLE_FAN.  The second parameter must
 * be an array of 4 numbers in the range 0.0 to 1.0, giving the RGBA color of
 * the color of the primitive.  The third parameter must be an array of numbers.
 * The length of the array must be a multiple of 3.  Each triple of numbers provides
 * xyz-coords for one vertex for the primitive.  This assumes that u_color is the
 * location of a color uniform in the shader program, a_coords_loc is the location of
 * the coords attribute, and a_coords_buffer is a VBO for the coords attribute.
 */
function drawPrimitive(primitiveType, color, vertices, texCoords) {
    gl.uniform4fv(iColor, color);
    gl.uniform1f(iColorCoef, 0.0);

    gl.enableVertexAttribArray(iAttribVertex);
    gl.bindBuffer(gl.ARRAY_BUFFER, iVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
    gl.vertexAttribPointer(iAttribVertex, 3, gl.FLOAT, false, 0, 0);

    if (texCoords) {
        gl.enableVertexAttribArray(iAttribTexture);
        gl.bindBuffer(gl.ARRAY_BUFFER, iTexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STREAM_DRAW);
        gl.vertexAttribPointer(iAttribTexture, 2, gl.FLOAT, false, 0, 0);
    } else {
        gl.disableVertexAttribArray(iAttribTexture);
        gl.vertexAttrib2f(iAttribTexture, 0.0, 0.0);
        gl.uniform1f(iColorCoef, 1.0);
    }

    gl.drawArrays(primitiveType, 0, vertices.length / 3);
}

const degtorad = Math.PI / 180; // Degree-to-Radian conversion

function getRotationMatrix( alpha, beta, gamma ) {

    const _x = beta  ? -beta  * degtorad : 0; // beta value
    const _y = gamma ? -gamma * degtorad : 0; // gamma value
    const _z = alpha ? -alpha * degtorad : 0; // alpha value

    const cX = Math.cos( _x );
    const cY = Math.cos( _y );
    const cZ = Math.cos( _z );
    const sX = Math.sin( _x );
    const sY = Math.sin( _y );
    const sZ = Math.sin( _z );

    //
    // ZXY rotation matrix construction.
    //

    const m11 = cZ * cY - sZ * sX * sY;
    const m12 = - cX * sZ;
    const m13 = cY * sZ * sX + cZ * sY;

    const m21 = cY * sZ + cZ * sX * sY;
    const m22 = cZ * cX;
    const m23 = sZ * sY - cZ * cY * sX;

    const m31 = - cX * sY;
    const m32 = sX;
    const m33 = cX * cY;

    return [
        m11, m12, m13, 0,
        m21, m22, m23, 0,
        m31, m32, m33, 0,
        0, 0, 0, 1
    ];

}

window.addEventListener('deviceorientation', function(event) {
    rotationMatrix = getRotationMatrix(event.alpha, event.beta, event.gamma);
    draw();
});

function DrawSurface() {
    let allCoordinates = [];
    let i = 0;

    // Apply equations and draw horizontal meridians
    for (let r = 0; r <= 7; r += Math.PI / 8) {
        let coordinates = [];

        for (let B = 0; B <= 2 * Math.PI; B += Math.PI / 10) {
            const generatedCoords = [x(r, B), y(r, B), z(r)];

            coordinates = [...coordinates, ...generatedCoords];
        }

        drawPrimitive(gl.LINE_STRIP, [1, 1, 0, 1], coordinates);

        allCoordinates[i++] = [...coordinates];
        coordinates = [];
    }

    // Draw vertical meridians
    for (let j = 0; j < allCoordinates[0].length; j += 3) {
        let coordinates = [];

        for (let k = 0; k < allCoordinates.length; k++) {
            coordinates = [...coordinates, allCoordinates[k][j], allCoordinates[k][j + 1], allCoordinates[k][j + 2]];
        }

        drawPrimitive(gl.LINE_STRIP, [1, 1, 0, 1], coordinates);
        coordinates = [];
    }

    if (isFilled) {
        for (let i = 0; i < allCoordinates.length - 1; i++) {
            let coordinates = [];

            for (let j = 0; j < allCoordinates[i].length; j += 3) {
                coordinates = [...coordinates, allCoordinates[i][j], allCoordinates[i][j + 1], allCoordinates[i][j + 2]];
                coordinates = [...coordinates, allCoordinates[i + 1][j], allCoordinates[i + 1][j + 1], allCoordinates[i + 1][j + 2]];
                coordinates = [...coordinates, allCoordinates[i][j + 3], allCoordinates[i][j + 4], allCoordinates[i][j + 5]];
                coordinates = [...coordinates, allCoordinates[i + 1][j + 3], allCoordinates[i + 1][j + 4], allCoordinates[i + 1][j + 5]];
            }

            drawPrimitive(gl.TRIANGLE_STRIP, [0.5, 0, 1, 1], coordinates);
            coordinates = [];
        }
    }

    /* Draw coordinate axes */
    gl.lineWidth(4);
    drawPrimitive(gl.LINES, [1, 0, 0, 1], [-9, 0, 0, 9, 0, 0]);
    drawPrimitive(gl.LINES, [0, 1, 0, 1], [0, -9, 0, 0, 9, 0]);
    drawPrimitive(gl.LINES, [0, 0, 1, 1], [0, 0, -9, 0, 0, 9]);
    gl.lineWidth(1);
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    let translateToPointZero = m4.translation(0, 0, -10);

    let matAccum = m4.multiply(rotateToPointZero, modelView);
    let matAccum0 = m4.multiply(matAccum, rotationMatrix);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);

    let cam = new StereoCamera(
        2000,
        eyeSeparation,
        aspect,
        90,
        1,
        20000
    );

    let modelViewProjectionL = m4.multiply(cam.getLeftFrustum(), matAccum1);
    let modelViewProjectionR = m4.multiply(cam.getRightFrustum(), matAccum1);

    gl.uniformMatrix4fv(iModelViewProjectionMatrix, false, modelViewProjectionL);
    gl.colorMask(true, false, false, false);

    DrawSurface();

    gl.clear(gl.DEPTH_BUFFER_BIT);

    gl.uniformMatrix4fv(iModelViewProjectionMatrix, false, modelViewProjectionR);
    gl.colorMask(false, true, true, false);

    DrawSurface();

    gl.clear(gl.DEPTH_BUFFER_BIT);

    gl.colorMask(true, true, true, true);
}

class StereoCamera {
    constructor(
        Convergence,
        EyeSeparation,
        AspectRatio,
        FOV,
        NearClippingDistance,
        FarClippingDistance
    ) {
        this.mConvergence = Convergence;
        this.mEyeSeparation = EyeSeparation;
        this.mAspectRatio = AspectRatio;
        this.mFOV = FOV * Math.PI / 180
        this.mNearClippingDistance = NearClippingDistance;
        this.mFarClippingDistance = FarClippingDistance;

        this.top = this.mNearClippingDistance * Math.tan(this.mFOV / 2);
        this.bottom = -this.top;

        this.a = this.mAspectRatio * Math.tan(this.mFOV / 2) * this.mConvergence;
        this.b = this.a - this.mEyeSeparation / 2;
        this.c = this.a + this.mEyeSeparation / 2;
    }

    getLeftFrustum() {
        const left = -this.b * this.mNearClippingDistance / this.mConvergence;
        const right = this.c * this.mNearClippingDistance / this.mConvergence;

        const translate = m4.translation(this.mEyeSeparation / 2 / 100, 0, 0);

        const projection = m4.frustum(left, right, this.bottom, this.top, this.mNearClippingDistance, this.mFarClippingDistance);

        return m4.multiply(projection, translate)
    }

    getRightFrustum() {
        const left = -this.c * this.mNearClippingDistance / this.mConvergence;
        const right = this.b * this.mNearClippingDistance / this.mConvergence;

        const translate = m4.translation(-this.mEyeSeparation / 2 / 100, 0, 0);

        const projection = m4.frustum(left, right, this.bottom, this.top, this.mNearClippingDistance, this.mFarClippingDistance);

        return m4.multiply(projection, translate)
    }
}

/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    gl.useProgram(prog);

    iAttribVertex = gl.getAttribLocation(prog, "vertex");
    iAttribTexture = gl.getAttribLocation(prog, "texCoord");

    iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    iColor = gl.getUniformLocation(prog, "color");
    iColorCoef = gl.getUniformLocation(prog, "fColorCoef");
    iTextureMappingUnit = gl.getUniformLocation(prog, "u_texture");

    iVertexBuffer = gl.createBuffer();
    iTexBuffer = gl.createBuffer();

    // LoadTexture();

    gl.enable(gl.DEPTH_TEST);
}

/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}


/**
 * initialization function that will be called when the page has loaded
 */
function init() {
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if (!gl) {
            throw "Browser does not support WebGL";
        }
    } catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    } catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, draw, 0);

    draw();
}

function handleCheckboxChange() {
    isFilled = document.getElementById("isFilled").checked;
    draw();
}

function handleEyeSeparationChange() {
    eyeSeparation = parseInt(document.getElementById("eye_separation").value);
    draw();
}
