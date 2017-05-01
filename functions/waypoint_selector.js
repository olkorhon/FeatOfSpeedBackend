
data = [{"waypoint_id":0,"name":"University of Oulu","location":{"lat":65.0593177,"lng":25.4662935}},{"waypoint_id":1,"name":"Oulun yliopiston kirjasto","location":{"lat":65.05928399999999,"lng":25.466415}},{"waypoint_id":2,"name":"University of Oulu - School of Architecture","location":{"lat":65.0593177,"lng":25.4662935}},{"waypoint_id":3,"name":"Oulun yliopiston eläinmuseo","location":{"lat":65.06059429999999,"lng":25.4669362}},{"waypoint_id":4,"name":"Oulun yliopiston ylioppilaskunta","location":{"lat":65.05894529999999,"lng":25.4657567}},{"waypoint_id":5,"name":"Saint Luces Chapel","location":{"lat":65.0606012,"lng":25.4715954}},{"waypoint_id":6,"name":"Suomen Terveystalo Oy","location":{"lat":65.0568622,"lng":25.47213}},{"waypoint_id":7,"name":"Ravintola Kastari","location":{"lat":65.05723960000002,"lng":25.4675853}},{"waypoint_id":8,"name":"Oulun Lääketieteellinen Kilta R.Y.","location":{"lat":65.0590607,"lng":25.4663976}},{"waypoint_id":9,"name":"Oulun Akateeminen Mölökky- Ja Kyykkäseura Ry","location":{"lat":65.0593008,"lng":25.4664636}},{"waypoint_id":10,"name":"Oulun Teekkarikuoro Teeku Ry","location":{"lat":65.0592296,"lng":25.4662538}},{"waypoint_id":11,"name":"Täydentävien opintojen keskus","location":{"lat":65.05957599999999,"lng":25.469573}},{"waypoint_id":12,"name":"LeaF - infrastruktuuri","location":{"lat":65.0590607,"lng":25.4663976}},{"waypoint_id":13,"name":"Ylioppilaiden terveydenhoitosäätiö","location":{"lat":65.0577689,"lng":25.4712983}},{"waypoint_id":14,"name":"Oulun Yliopiston Prosessikilta Ry","location":{"lat":65.0593177,"lng":25.4662935}},{"waypoint_id":15,"name":"Oulun Luokanopettajaopiskelijat ry","location":{"lat":65.0590607,"lng":25.4663976}},{"waypoint_id":16,"name":"Yliopiston Paperikauppa","location":{"lat":65.0590607,"lng":25.4663976}},{"waypoint_id":17,"name":"Oulun Yliopiston Ympäristörakentajakilta ry","location":{"lat":65.05887,"lng":25.4658617}},{"waypoint_id":18,"name":"Tellus Innovation Arena, Oulun Yliopisto","location":{"lat":65.0586733,"lng":25.4661093}},{"waypoint_id":19,"name":"Oulun yliopisto, Täydentävien opintojen keskus TOPIK","location":{"lat":65.0601625,"lng":25.4656108}}]

console.log(data);
optimize(data, 4);
console.log("\n");
console.log(data);


function optimize(locations, target_nodes) {
    if (locations.length <= target_nodes) {
        return; // Nothing to optimize
    }

    let pairs = []
    let extra_nodes = locations.length - target_nodes;

    for (let i = 0; i < locations.length - 1; i++) {
        for (let j = i + 1; j < locations.length; j++) {
            pairs.push([getDistance(locations[i], locations[j]), i, j]);
        }
    }

    // Sort pairs in ascending order
    pairs.sort(function (a, b) { return a[0] - b[0]; });

    // Filter out nodes untill we reach target nodes
    for (let i = 0; i < extra_nodes; i++) {
        let rng = Math.floor((Math.random() * 2) + 1);

        locations[pairs[0][rng]] = null;
        filterOutNode(pairs, pairs[0][rng]);
    }

    // Remove null nodes from locations
    for (let i = locations.length - 1; i >= 0; i--) {
        if (locations[i] === null)
            locations.splice(i, 1);
    }
}

// Filters out a single node from pairs array
function filterOutNode(pairs, node) {
    for (let i = pairs.length - 1; i >= 0; i--) {
        if (pairs[i][1] === node || pairs[i][2] === node) {
            pairs.splice(i, 1);
        }
    }
}

// Return distance between 2 coordinates
function getDistance(p1, p2) {
    let dlat = p1.location.lat - p2.location.lat;
    let dlng = p1.location.lng - p2.location.lng;

    return Math.sqrt(dlat * dlat + dlng * dlng);
}

module.exports = {
    optimize: optimize
};