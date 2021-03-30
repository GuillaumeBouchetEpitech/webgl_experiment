
"use strict"

interface IPointerLockDef {
    target_element: HTMLElement;
    cb_enabled: () => void;
    cb_disabled: () => void;
    cb_error?: (error: any) => void;
};

const PointerLockSetup = (def: IPointerLockDef) => {

    def.target_element.requestPointerLock = def.target_element.requestPointerLock ||
                                            (def.target_element as any).mozRequestPointerLock ||
                                            (def.target_element as any).webkitRequestPointerLock;

    document.exitPointerLock = document.exitPointerLock ||
                               (document as any).mozExitPointerLock ||
                               (document as any).webkitExitPointerLock;

    def.target_element.onclick = () => {

        if (def.target_element.requestPointerLock)
            def.target_element.requestPointerLock();
    };

    //
    //
    //

    const onLockChange = () => {

        if (document.pointerLockElement === def.target_element ||
            (document as any).mozPointerLockElement === def.target_element ||
            (document as any).webkitPointerLockElement === def.target_element) {

            console.log('The pointer lock status is now locked');

            def.cb_enabled();
        }
        else {

            console.log('The pointer lock status is now unlocked');

            def.cb_disabled();
        }
    };

    const onLockError = (event: Event) => {

        console.error("Pointer lock failed");
        console.error(event);

        if (def.cb_error)
            def.cb_error(event);
    };

    //
    //
    //

    if ("onpointerlockchange" in document)
        document.addEventListener('pointerlockchange', onLockChange, false);
    else if ("onmozpointerlockchange" in document)
        (document as any).addEventListener('mozpointerlockchange', onLockChange, false);
    else if ("onwebkitpointerlockchange" in document)
        (document as any).addEventListener('webkitpointerlockchange', onLockChange, false);

    if ("onpointerlockerror" in document)
        document.addEventListener('pointerlockerror', onLockError, false);
    else if ("onmozpointerlockerror" in document)
        (document as any).addEventListener('mozpointerlockerror', onLockError, false);
    else if ("onwebkitpointerlockerror" in document)
        (document as any).addEventListener('webkitpointerlockerror', onLockError, false);

};

export default PointerLockSetup;
