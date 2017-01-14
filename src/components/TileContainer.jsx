import React from "react";
import {chunk} from "lodash";

export default class TileContainer extends React.Component {
    render() {
        const {width, tiles, toggle} = this.props;

        const rows = chunk(tiles, width).map(
            (row, index) => {   
                /* Every tile in the current row */
                const cell = row.map((tile, index) => {
                    const cellStyle = tile.isActive ? "box inputbox active" : "box inputbox";
                    return <div key={index} className={cellStyle} onClick={() => { toggle(tile.id) }}></div>
                });

                return <div key={index} className="inputbox-row">{cell}</div>
            }
        );

        return (<div>{rows}</div>);
    }
}