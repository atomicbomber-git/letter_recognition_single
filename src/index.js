import React from "react";
import ReactDOM from "react-dom";
import numeral from "numeral";
import {noop} from "lodash";
import {Network, Architect, Trainer} from "synaptic";
import Chance from "chance";
import "../node_modules/bulma/css/bulma.css";
import "./index.css";

import TileContainer from "./components/TileContainer.jsx";

import networkA from "./networks/networkA.json";
import networkB from "./networks/networkB.json";
import networkC from "./networks/networkC.json";

import letterA1 from "./letters/letter_a-1.json";
import letterB1 from "./letters/letter_b-1.json";
import letterC1 from "./letters/letter_c-1.json";
import letterA2 from "./letters/letter_a-2.json";
import letterB2 from "./letters/letter_b-2.json";
import letterC2 from "./letters/letter_c-2.json";

class App extends React.Component {
    constructor(props) {
        super(props);

        const letterWidth = letterB2.width;
        const letterTiles = letterB2.tiles;

        /* Initialize Chance, our random data generator */
        this.chance = new Chance();

        /* Initialize the perceptron network and its trainer  */
        const defaultNetwork = "B";
        this.networkTags = ["A", "B", "C"];
        this.networks = {
            A: Network.fromJSON(networkA),
            B: Network.fromJSON(networkB),
            C: Network.fromJSON(networkC)
        };

        this.network = new Architect.Perceptron(letterTiles.length, 15, 1);
        this.trainer = new Trainer(this.network);

        this.trainingSet = this.generateTrainingSet.bind(this)(letterTiles.length, 10000);
        
        /* The only training set which outputs to true */
        this.trainingSet.push({
            input: letterA1.tiles.map(tile => tile.isActive ? 1 : 0),
            output: [0]
        });

        this.trainingSet.push({
            input: letterA2.tiles.map(tile => tile.isActive ? 1 : 0),
            output: [0]
        });

        this.trainingSet.push({
            input: letterB1.tiles.map(tile => tile.isActive ? 1 : 0),
            output: [0]
        });

        this.trainingSet.push({
            input: letterB2.tiles.map(tile => tile.isActive ? 1 : 0),
            output: [0]
        });

        this.trainingSet.push({
            input: letterC1.tiles.map(tile => tile.isActive ? 1 : 0),
            output: [1]
        });

        this.trainingSet.push({
            input: letterC2.tiles.map(tile => tile.isActive ? 1 : 0),
            output: [1]
        });

        this.state = {
            currentNetwork: defaultNetwork,
            tileWidth: letterWidth,
            tiles: letterTiles,
            trainingSet: [],
            networkData: {},
            isTraining: false
        }

        this.toggleTile = this.toggleTile.bind(this);
        this.startTraining = this.startTraining.bind(this);
        this.cleanTiles = this.cleanTiles.bind(this);
        this.handleNetworkSelectionChange = this.handleNetworkSelectionChange.bind(this);
    }

    /*
        This function only generates training sets which outputs are false 
        due to the programmer's inability to generate good examples for the true
        counterparts
    */
    generateTrainingSet(tilesAmount, trainingSetAmount) {
        
        const chance = this.chance;

        const trainingSet = [];
        for (let i = 0; i < trainingSetAmount; i++) {
            const input = [];
            for (let j = 0; j < tilesAmount; j++) {
                input.push(chance.bool() ? 1 : 0);
            }
            trainingSet.push({
                input: input,
                output: [0]
            });
        }

        return trainingSet;
    }

    cleanTiles() {
        const emptyTiles = this.state.tiles.map((tiles) => { return {...tiles, isActive: false} });
        this.setState({ tiles: emptyTiles });
    }

    startTraining() {
        if (this.state.isTraining) return;
        this.setState({ isTraining: true });

        this.trainer.trainAsync(this.trainingSet, {
            rate: 0.2,
            error: 0.0000005
        })
        .then((results) => {
            this.setState({ isTraining: false, networkData: this.network.toJSON() });
        });
    }

    handleNetworkSelectionChange(e) {
        this.setState({ currentNetwork: e.target.value });
    }

    toggleTile(id) {    
        const updatedTiles = this.state.tiles.map((tile) => {
            if (tile.id === id) {
                return {...tile, isActive: !tile.isActive};
            }
            return tile;
        });

        this.setState({ tiles: updatedTiles });
    }
    
    render() {
        const {tiles, tileWidth, isTraining, networkData, currentNetwork} = this.state;
        const tilesInJson = JSON.stringify({
            width: tileWidth,
            tiles: tiles
        }, null, '\t');

        const networkDataInJson = JSON.stringify(networkData, null, '\t');
                
        const normalizedTiles = tiles.map(tile => tile.isActive ? 1 : 0)

        const network = this.networks[currentNetwork];
        const matchRate = network.activate(normalizedTiles)[0];

        const helper = (
            (matchRate) => {
                if (matchRate >= 0.90) {
                    return { class: "is-success", caption: "COCOK"};
                }
                else if (matchRate >= 0.50) {
                    return { class: "is-warning", caption: "KURANG COCOK"};                    
                }
                else {
                    return { class: "is-danger", caption: "TIDAK COCOK" }                    
                }
            }
        )(matchRate);

        const progressBarClass = `progress ${helper.class}`;
        const tagClass = `tag ${helper.class}`;

        const trainingButtonStyle = this.state.isTraining ?
            "button is-primary is-small is-loading" :
            "button is-primary is-small";

        const networkOptions = this.networkTags.map((tag) => {
            return ( 
                 <option selected={currentNetwork === tag} value={tag}>
                    Detektor Huruf {tag}
                </option>
            );
        });
        
        return (
            <div className="container" style={ {maxWidth: "1200px"} }>
                <div className="section">
                    <div className="columns">
                        <div className="column">
                            <div className="box">
                                <h2 className="title is-4"> PANEL </h2>
                                <p className="subtitle is-6"> Klik pada kotak untuk menyalakan atau memadamkan </p>
                                
                                <div className="content">

                                    <div className="box">
                                        <label className="label"> Jaringan yang Digunakan: </label>
                                        <span className="select">
                                            <select onChange={this.handleNetworkSelectionChange}>
                                                {networkOptions}
                                            </select>
                                        </span>
                                    </div>

                                    <div className="box">
                                        <label className="label"> Tingkat Kecocokan Huruf: </label>
                                        <progress className={progressBarClass} value={matchRate} max="1"> </progress>
                                        <p> 
                                            <span className={tagClass}> {numeral(matchRate * 100).format("0.00")}% ({helper.caption}) </span>
                                        </p>
                                    </div>
                                    
                                    <p className="has-text-centered">
                                        <button onClick={this.cleanTiles} className="button is-warning is-small">
                                            Bersihkan Semua Panel
                                        </button>
                                    </p>
                                    
                                </div>

                                <TileContainer toggle={this.toggleTile} width={tileWidth} tiles={tiles}/>
                            </div>
                        </div>
                        <div className="column">
                            <div className="box">
                                <h2 className="title is-4"> DATA </h2>
                                <p className="subtitle is-6"> Data JSON yang melambangkan status panel </p>                            
                                <textarea className="textarea" value={tilesInJson} onChange={noop}></textarea>
                            </div>
                        </div>
                        {/* <div className="column">
                            <div className="box">

                                <h2 className="title is-4"> JARINGAN </h2>
                                <p className="subtitle is-6"> Representasi Jaringan Syaraf Tiruan yang Digunakan </p>                            
                                
                                <div className="content">

                                    <p>
                                        <button onClick={this.startTraining} className={trainingButtonStyle}>
                                            Mulai Pelatihan
                                        </button>
                                    </p>

                                    <textarea className="textarea" value={networkDataInJson} onChange={noop}></textarea>

                                </div>
                                
                            </div>
                        </div> */}
                    </div>
                </div>
            </div>
        );
    }
}

ReactDOM.render(
    <App/>,
    document.getElementById("root")
);