
"use strict"

const handle_pointerLock = (canvas: HTMLElement, cb_enabled: () => void, cb_disabled: () => void, cb_error?: (error: any) => void) => {

    //
    //
    // // // POINTER LOCK

    canvas.requestPointerLock = canvas.requestPointerLock ||
                                (canvas as any).mozRequestPointerLock ||
                                (canvas as any).webkitRequestPointerLock;

    document.exitPointerLock =  document.exitPointerLock ||
                                (document as any).mozExitPointerLock ||
                                (document as any).webkitExitPointerLock;

    canvas.onclick = () => {

        if (canvas.requestPointerLock)
            canvas.requestPointerLock();
    };

    //
    //
    //

    const lockChangeAlert = () => {

        if (document.pointerLockElement === canvas ||
            (document as any).mozPointerLockElement === canvas ||
            (document as any).webkitPointerLockElement === canvas) {

            console.log('The pointer lock status is now locked');
            // Do something useful in response

            if (cb_enabled)
                cb_enabled();
        }
        else {

            console.log('The pointer lock status is now unlocked');
            // Do something useful in response

            if (cb_disabled)
                cb_disabled();
        }
    };

    const lockError = (event: Event) => {

        console.error("Pointer lock failed");

        if (cb_error)
            cb_error(event);
    };

    //
    //
    //

    if ("onpointerlockchange" in document)
        document.addEventListener('pointerlockchange', lockChangeAlert, false);
    else if ("onmozpointerlockchange" in document)
        (document as any).addEventListener('mozpointerlockchange', lockChangeAlert, false);
    else if ("onwebkitpointerlockchange" in document)
        (document as any).addEventListener('webkitpointerlockchange', lockChangeAlert, false);

    if ("onpointerlockerror" in document)
        document.addEventListener('pointerlockerror', lockError, false);
    else if ("onmozpointerlockerror" in document)
        (document as any).addEventListener('mozpointerlockerror', lockError, false);
    else if ("onwebkitpointerlockerror" in document)
        (document as any).addEventListener('webkitpointerlockerror', lockError, false);

    // // // POINTER LOCK
    //
    //

};

export default handle_pointerLock;
