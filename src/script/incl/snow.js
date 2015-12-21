'use strict'
// load ThreeJS
let scriptTag = document.createElement('script')
scriptTag.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r73/three.min.js'
document.body.appendChild(scriptTag)

// snow code and snowflake image from
// http://soledadpenades.com/articles/three-js-tutorials/rendering-snow-with-shaders/

window.addEventListener('load', function () {
	let renderer,
		scene,
		camera,
		cameraRadius = 40.0,
		cameraTarget,
		cameraX = 0,
		cameraY = 0,
		cameraZ = cameraRadius,
		particleSystem,
		particleSystemHeight = 100.0,
		clock,
		texture,
		snowDisabled = false,
		disableBtn

	init()
	animate()


	function init() {

		disableBtn = document.createElement('button')
		disableBtn.type = 'button'
		disableBtn.textContent = 'Toggle snow'

		renderer = new THREE.WebGLRenderer({ alpha: true })
		renderer.setSize( window.innerWidth, window.innerHeight )
		renderer.setClearColor( 0x000000, 0 )

		scene = new THREE.Scene()

		camera = new THREE.PerspectiveCamera( 40, 4/3, 1, 100 )
		cameraTarget = new THREE.Vector3( 0, 0, 0 )

		texture = new THREE.TextureLoader().load('img/snowflake.png')

		let numParticles = 10000,
			width = 100,
			height = particleSystemHeight,
			depth = 100,
			parameters = {
				color: 0xDDDDFF,
				height: particleSystemHeight,
				radiusX: 2.5,
				radiusZ: 2.5,
				size: 100,
				scale: 4.0,
				opacity: 0.6,
				speedH: 0.5,
				speedV: 0.5
			},
			systemGeometry = new THREE.Geometry(),
			systemMaterial = new THREE.ShaderMaterial({
				uniforms: {
					color:  { type: 'c', value: new THREE.Color( parameters.color ) },
					height: { type: 'f', value: parameters.height },
					elapsedTime: { type: 'f', value: 0 },
					radiusX: { type: 'f', value: parameters.radiusX },
					radiusZ: { type: 'f', value: parameters.radiusZ },
					size: { type: 'f', value: parameters.size },
					scale: { type: 'f', value: parameters.scale },
					opacity: { type: 'f', value: parameters.opacity },
					texture: { type: 't', value: texture },
					speedH: { type: 'f', value: parameters.speedH },
					speedV: { type: 'f', value: parameters.speedV }
				},
				vertexShader: `
					uniform float radiusX;
					uniform float radiusZ;
					uniform float size;
					uniform float scale;
					uniform float height;
					uniform float elapsedTime;
					uniform float speedH;
					uniform float speedV;
					void main() {
						vec3 pos = position;
						pos.x += cos((elapsedTime + position.z) * 0.25 * speedH) * radiusX;
						pos.y = mod(pos.y - elapsedTime * speedV, height);
						pos.z += sin((elapsedTime + position.x) * 0.25 * speedH) * radiusZ;
						vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
						gl_PointSize = size * ( scale / length( mvPosition.xyz ) );
						gl_Position = projectionMatrix * mvPosition;
					}
				`,
				fragmentShader: `
					uniform vec3 color;
					uniform float opacity;
					uniform sampler2D texture;
					void main() {
						vec4 texColor = texture2D( texture, gl_PointCoord );
						gl_FragColor = texColor * vec4( color, opacity );
					}
				`,
				blending: THREE.AdditiveBlending,
				transparent: true,
				depthTest: false
			})

		for( let i = 0; i < numParticles; i++ ) {
			let vertex = new THREE.Vector3(
					rand( width ),
					Math.random() * height,
					rand( depth )
				)

			systemGeometry.vertices.push( vertex )
		}

		particleSystem = new THREE.Points( systemGeometry, systemMaterial )
		particleSystem.position.y = -height/2

		scene.add( particleSystem )


		document.body.appendChild( renderer.domElement )
		document.body.appendChild( disableBtn )

		let r = renderer.domElement
		disableBtn.style.position = r.style.position = 'fixed'
		disableBtn.style.left = r.style.left = 0
		r.style.top = 0
		disableBtn.style.bottom = 0
		disableBtn.style.zIndex = r.style.zIndex = 100000
		r.style.pointerEvents = 'none'
		disableBtn.style.opacity = 0.6
		disableBtn.style.fontSize = '14px'
		disableBtn.style.padding = '6px 10px'

		window.addEventListener( 'resize', onWindowResize, false )

		disableBtn.addEventListener('click', toggleSnow, false)
		r.addEventListener('click', toggleSnow, false)

		if (window.DeviceOrientationEvent) {
			window.addEventListener('deviceorientation', orientation, false)
		} else{
			console.log('DeviceOrientationEvent is not supported :(')
		}

		clock = new THREE.Clock()
	}

	function onWindowResize() {
		renderer.setSize( window.innerWidth, window.innerHeight )
	}

	function toggleSnow() {
		if (snowDisabled) {
			snowDisabled = false
			renderer.domElement.style.display = 'block'
			animate()
		} else {
			snowDisabled = true
			renderer.domElement.style.display = 'none'
		}
	}

	function orientation() {
		cameraX = cameraRadius * Math.cos( (event.gamma + 90)*2 * (Math.PI/180) * 0.3 )
		cameraY = cameraRadius * Math.sin( (event.beta + 180) * (Math.PI/180) * 0.1 )
		//console.log(cameraX, cameraY)
	}

	function rand( v ) {
		return (v * (Math.random() - 0.5))
	}

	function animate() {
		if (snowDisabled) {
			return
		}

		requestAnimationFrame( animate )

		let elapsedTime = clock.getElapsedTime()

		particleSystem.material.uniforms.elapsedTime.value = elapsedTime * 10

		camera.position.set( cameraX, cameraY, cameraZ )
		camera.lookAt( cameraTarget )

		renderer.clear()
		renderer.render( scene, camera )
	}
}, false)
