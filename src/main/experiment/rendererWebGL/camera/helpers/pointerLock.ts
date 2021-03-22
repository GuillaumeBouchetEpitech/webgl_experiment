
"use strict"

const handle_pointerLock = (target_element: HTMLElement, cb_enabled: () => void, cb_disabled: () => void, cb_error?: (error: any) => void) => {

    target_element.requestPointerLock = target_element.requestPointerLock ||
                                        (target_element as any).mozRequestPointerLock ||
                                        (target_element as any).webkitRequestPointerLock;

    document.exitPointerLock =  document.exitPointerLock ||
                                (document as any).mozExitPointerLock ||
                                (document as any).webkitExitPointerLock;

    target_element.onclick = () => {

        if (target_element.requestPointerLock)
            target_element.requestPointerLock();
    };

    //
    //
    //

    const lockChangeAlert = () => {

        if (document.pointerLockElement === target_element ||
            (document as any).mozPointerLockElement === target_element ||
            (document as any).webkitPointerLockElement === target_element) {

            console.log('The pointer lock status is now locked');

            cb_enabled();
        }
        else {

            console.log('The pointer lock status is now unlocked');

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

};

export default handle_pointerLock;
