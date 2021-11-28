class Object {
  constructor(idObject, label, isDangerous, isMoving, isARoad, isAFood, position) {
    this.idObject = idObject;
    this.label = label;
    this.isDangerous = isDangerous;
    this.isMoving = isMoving;
    this.isARoad = isARoad;
    this.isAFood = isAFood;
    this.position = position;
  }
  sing() {
    return `${this.name} can sing`;
  }
  dance() {
    return `${this.name} can dance`;
  }
}
