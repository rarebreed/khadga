import { logger } from "../logger";

/**
 * Make the DIV element draggable:
 */
const dragElement = (elmnt: HTMLDivElement, id: string) => {
  let pos1 = 0;
  let pos2 = 0;
  let pos3 = 0;
  let pos4 = 0;
  
  const helem = document.getElementById(id);
  logger.log("helem is ", helem);
  if (!helem) {
    logger.log("Setting handler for base element", elmnt);
    elmnt.onmousedown = dragMouseDown;
  } else {
    logger.log(`Setting handler for ${helem.className}`, helem);
    helem.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e: MouseEvent) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    logger.log("drag mouse event", e);
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e: MouseEvent) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
};

export const resizeElement = (elmnt: HTMLElement, id: string) => {
  let pos1 = 0;
  let pos2 = 0;
  let pos3 = 0;
  let pos4 = 0;

  const helem = document.getElementById(id);
  let velem: HTMLVideoElement;
  if (!helem) {
    elmnt.onmousedown = dragMouseDown;
  } else {
    velem = helem as HTMLVideoElement;
    velem.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e: MouseEvent) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e: MouseEvent) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the width and height as a ratio of a change in position
    if (velem) {
      velem.width = velem.width - pos1;
      velem.height = velem.height - pos2;
    }
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
};

export const shuffle = <T>(container: T[]) => {
  let size = container.length;
  while (size > 0) {
    // randomly pick one element and swap with last element
    let rnd = Math.floor(Math.random() * (size - 1));
    let tmp = container[size - 1];
    container[size - 1] = container[rnd];
    container[rnd] = tmp;
    size--;
  }
}

export function* range(
	end: number = Infinity,
	start: number = 0,
	inc: number = 1
): Generator<number> {
	while (start <= end) {
		yield start;
		start += inc;
	}
}

export const take = <T>(gen: Iterable<T>) => (amt: number) => {
	let start = 0;
	let result: T[] = [];
	for(const val of gen) {
		if (start > amt) break
		result.push(val);
		start++;
	}
	return result;
}

export function zip<T1, T2>(seq1: Iterable<T1>, seq2: Iterable<T2>) {
  const iterables = [seq1, seq2];
  const iterators = iterables.map(i => i[Symbol.iterator]());
  let done = false;
  return {
      [Symbol.iterator]() {
          return this;
      },
      next() {
          if (!done) {
              const items = iterators.map(i => i.next());
              done = items.some(item => item.done);
              if (!done) {
                  return { value: items.map(i => i.value) };
              }
              // Done for the first time: close all iterators
              for (const iterator of iterators) {
                  if (typeof iterator.return === 'function') {
                      iterator.return();
                  }
              }
          }
          // We are done
          return { done: true };
      }
  }
}

export class Fn {
	private gen: Generator<number> | null
	private taken: number[]

	constructor() {
		this.gen = null;
		this.taken = [];
	}

	static new = () => {
		return new Fn()
	}

	range = (end: number = Infinity, start: number = 0, inc: number = 1)=> {
		this.gen = range(end, start, inc);
		return this
	}

	take = <T>(amt: number, gen?: Generator<T>) => {
    if (gen) {
      return take(gen)(amt);
    }
		if (this.gen === null) {
			throw new Error("this.gen is null")
		}
		this.taken = take(this.gen)(amt);
		return this.taken
	}
}

export default dragElement;