const video = document.getElementById('videoInput')

last_ts = 0
first_ts = 0
current_ts = 0
first_last_diff = 0
current_last_diff = 0
out_of_frame_cntr = 0
first_current_diff = 0
stop_sim = false

navigator.getUserMedia({
		video: {}
	},
	stream => video.srcObject = stream,
	err => console.error(err)
)


Promise.all([
	faceapi.nets.faceRecognitionNet.loadFromUri('../static/models'),
	faceapi.nets.faceLandmark68Net.loadFromUri('../static/models'),
	faceapi.nets.ssdMobilenetv1.loadFromUri('../static/models')
]).then(startWebCam)

function startWebCam() {
	console.log('Models Loaded')
	console.log('video added')
	recognizeFaces()
}

function startBtn() {
	document.getElementById('videoInput').play()
}


function stopBtn() {
	const stream = video.srcObject;
	const tracks = stream.getTracks();

	tracks.forEach(function (track) {
		track.stop();
	});

	video.srcObject = null;
}


async function recognizeFaces() {
	const labeledDescriptors = await loadLabeledImages()
	// console.log(labeledDescriptors)
	const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.7)
	document.getElementById('videoInput').play()
	video.addEventListener('play', async() => {
		console.log('Playing')
		const canvas = faceapi.createCanvasFromMedia(video)
		//document.body.append(canvas)

		const displaySize = {
			width: video.width,
			height: video.height
		}
		faceapi.matchDimensions(canvas, displaySize)


		setInterval(async() => {
			const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors()

			const resizedDetections = faceapi.resizeResults(detections, displaySize)

			canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)

			const results = resizedDetections.map((d) => {
				return faceMatcher.findBestMatch(d.descriptor)
			})

			current_ts = new Date().valueOf()
			first_last_diff = parseInt((last_ts - first_ts) / 1000)
			current_last_diff = (current_ts - last_ts) / 1000
			if (first_ts > 0) {
				first_current_diff = current_ts - first_ts
			}


			if (current_ts % 1000 > 900) {
				// console.log(`first_last_diff: ${first_last_diff}`)
				if (first_last_diff > 0) {
					document.getElementById('since_first_frame_cntr').innerText = `Fare: dh ${parseFloat(first_last_diff*0.32).toFixed(2)}`
				}
				if (first_ts > 0) {
					out_of_frame_cntr = parseInt(current_last_diff)
				}

				if ((out_of_frame_cntr > 3) && (!stop_sim)) {
					document.getElementById('name').innerText = `Thank You For Riding With Us`
					document.getElementById('seat-belt').innerText = `Your Total is: dh${parseFloat(first_last_diff*0.32).toFixed(2)}`
					document.getElementById('since_first_frame_cntr').style.display = "none";
					document.getElementById('out_of_frame_cntr').style.display = "none";
					document.getElementById('since_first_frame_cntr').style.display = "none";
					stopBtn()
					stop_sim = true
				}
			}


			results.forEach((result, i) => {
				const box = resizedDetections[i].detection.box
				const drawBox = new faceapi.draw.DrawBox(box, {
					label: result.toString()
				})
				//drawBox.draw(canvas)
				console.log(`result._label==============${result._label}`)
				if (first_ts === 0 && result._label != 'unknown') {
					first_ts = new Date().valueOf()
					document.getElementById('name').innerText = `Welcome ${result._label.toUpperCase()}`
					document.getElementById('seat-belt').innerText = `Fasten Your Seat Belt and Enjoy the Ride!`
				}
				last_ts = new Date().valueOf()
			})
		}, 100)


	})
}


function loadLabeledImages() {
	// const labels = ['henok', 'momen', ]
	// const labels = `{{labels}}`
	//console.log(labels)
	return Promise.all(
		labels.map(async(label) => {
			const descriptions = []
			for (let i = 1; i <= 2; i++) {
				// const img = await faceapi.fetchImage(`../static/images/${label}/${i}.jpg`)
				const img = await faceapi.fetchImage(`../static/images/${label}.jpg`)
				// console.log(img)
				const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
				// console.log(detections)
				//console.log(label + i + JSON.stringify(detections))
				descriptions.push(detections.descriptor)
			}
			//console.log(label + ' Faces Loaded | ')
			return new faceapi.LabeledFaceDescriptors(label, descriptions)
		})
	)
}