import * as CANNON from 'cannon-es';

export class Fragment {
    constructor(obj, mesh, position) {
        this.obj = obj;
        this.position = position;
        this.mesh = mesh;
        this.body;
        this.initMesh();
    }

    initMesh() {
        this.body = new CANNON.Body({
            type: CANNON.Body.DYNAMIC,
            mass: 5,
            shape: new CANNON.Box(new CANNON.Vec3(0.25,0.25,0.25)),
        });
        this.body.allowSleep = true;
        this.body.sleepSpeedLimit = 0.5;
        this.body.sleepTimeLimit = 1.0;
        this.body.position = new CANNON.Vec3(this.position.x, this.position.y + 1 , this.position.z);
        this.obj.addBody(this.body);
    }

    updateMesh() {
        let pos = new CANNON.Vec3(this.body.position.x - this.position.x, this.body.position.y - this.position.y, this.body.position.z - this.position.z);
        this.mesh.position.copy(pos);
        //this.mesh.quaternion.copy(this.body.quaternion);
    }

    // freezeMesh(){
    //     this.body.mass = 0; 
    //     this.body.updateMassProperties();
    // }

    // unfreezeMesh(){
    //     this.body.mass = 5; 
    //     this.body.updateMassProperties();
    // }

}