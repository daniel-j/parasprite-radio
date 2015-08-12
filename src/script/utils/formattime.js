
import zf from './zf'

export default function formattime(time) {
	time = time|0
	if (time < 3600) {
		return (time / 60|0)+':'+zf(time % 60)
	} else {
		return (time / 3600|0)+':'+zf((time % 3600)/60|0)+':'+zf((time % 3600)%60)
	}
}
