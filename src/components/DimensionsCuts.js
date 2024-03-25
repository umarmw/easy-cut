"use client"
import React, { useState } from 'react';
import { Input } from "@nextui-org/react";
import {Button} from "@nextui-org/react";


interface Dimension {
  width: number;
  height: number;
}

interface Node {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Pane {
  dimensions: Dimension[];
  notFit?: Pane[];
}

function intersects(rect1: Node, rect2: Node): boolean {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

function bestFitDecreasing(dimensions: Dimension[], paneWidth: number, paneHeight: number): Pane[] {
  dimensions.sort((a, b) => (b.width * b.height) - (a.width * a.height));

  const initialNode: Node = { x: 0, y: 0, width: paneWidth, height: paneHeight };
  const placedNodes: Node[] = [];
  const notFitNodes: Dimension[] = [];

  function findBestPlacement(node: Node, dimension: Dimension): Node | null {
    let bestFit: Node | null = null;

    for (let y = 0; y <= node.height - dimension.height; y++) {
      for (let x = 0; x <= node.width - dimension.width; x++) {
        const placedNode: Node = { x: node.x + x, y: node.y + y, width: dimension.width, height: dimension.height };
        let fits = true;

        for (const existingNode of placedNodes) {
          if (intersects(placedNode, existingNode)) {
            fits = false;
            break;
          }
        }

        if (fits) {
          if (!bestFit || (placedNode.width * placedNode.height < bestFit.width * bestFit.height)) {
            bestFit = placedNode;
          }
        }
      }
    }

    return bestFit;
  }

  function placeDimension(node: Node, index: number): void {
    if (index === dimensions.length) {
      return;
    }

    const dimension = dimensions[index];
    const bestFit = findBestPlacement(node, dimension);

    if (bestFit) {
      placedNodes.push(bestFit);
      const remainingNode = splitNode(node, bestFit);
      placeDimension(remainingNode, index + 1);
    } else {
      notFitNodes.push(dimension);
    }
  }

  function splitNode(node: Node, placedNode: Node): Node {
    const remainingWidth = node.width - placedNode.width;
    const remainingHeight = node.height - placedNode.height;

    if (remainingWidth > remainingHeight) {
      return { x: node.x + placedNode.width, y: node.y, width: remainingWidth, height: node.height };
    } else {
      return { x: node.x, y: node.y + placedNode.height, width: node.width, height: remainingHeight };
    }
  }

  placeDimension(initialNode, 0);

  if (notFitNodes.length === 0) {
    return [{ dimensions: placedNodes }];
  } else {
    return [{ dimensions: placedNodes, notFit: bestFitDecreasing(notFitNodes, paneWidth, paneHeight) }];
  }
}

function paneRenderer(paneIndex, paneWidth, paneHeight, pane) {
  return (
    <React.Fragment>
      <h2>Pane {paneIndex + 1}</h2>
      <div style={{ position: 'relative', width: paneWidth, height: paneHeight, border: '2px solid grey' }}>
        {pane.dimensions.map((dimension, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: dimension.x,
              top: dimension.y,
              width: dimension.width,
              height: dimension.height,
              border: '1px solid red',
              boxSizing: 'border-box',
            }}
          >
            {`${dimension.width} x ${dimension.height}`}
          </div>
        ))}
      </div>
    </React.Fragment>
  )
}
function DimensionCuts({ panes, paneWidth, paneHeight, paneIndex =0 }: { panes: Pane[]; paneWidth: number; paneHeight: number; paneIndex: number }) {
  return (
    <React.Fragment>
      {panes.map((pane) => (
        <React.Fragment>
          <div key={paneIndex} style={{ marginRight: '20px' }}>
            {paneRenderer(paneIndex, paneWidth, paneHeight, pane)}
          </div>
          {pane.notFit && (
            <DimensionCuts
              panes={pane.notFit}
              paneWidth={paneWidth}
              paneHeight={paneHeight}
              paneIndex={paneIndex+1}
            />
          )}
        </React.Fragment>
      ))
    }
    </React.Fragment>
  );
}

//-------------------------------------------

function DimensionCuts() {

  // const [dimensions] = useState<Dimension[]>([
  //   { width: 500, height: 100 },
  //   { width: 500, height: 50 },
  //   { width: 500, height: 80 },
  //   { width: 500, height: 90 },
  //   { width: 500, height: 100 },
  //   { width: 500, height: 100 },
  //   { width: 500, height: 200 },
  // ]);
  // const paneWidth = 500;
  // const paneHeight = 300;

  const [dimensions, setDimensions] = useState([]);
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [paneWidth, setPaneWidth] = useState("");
  const [paneHeight, setPaneHeight] = useState("");

  const addDimension = () => {
    if (width && height) {
      setDimensions([
        ...dimensions,
        { width: parseInt(width), height: parseInt(height) },
      ]);
      setWidth("");
      setHeight("");
    }
  };
 


  const panes: Pane[] = bestFitDecreasing(dimensions, paneWidth, paneHeight);

  console.log("panes", panes);

  return (
    <div>
      <h1>Dimension Cuts</h1>
  

      <div className="pr-10">
        <div className="flex gap-4 ">
          <Input
            className="w-fit "
            label="PanWidth"
            type="text"
            onChange={(e) => setPaneWidth(e.target.value)}
          />
          <Input
            className="w-fit"
            label="PanHeight"
            type="text"
            onChange={(e) => setPaneHeight(e.target.value)}
          />
          {/* <p>{paneWidth}</p>
          <p>{paneHeight}</p> */}
        </div>

        <div className="flex gap-4 py-10">
          <Input
            className="w-fit"
            label="Width"
            type="text"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
          />
          <Input
            className="w-fit"
            label="Height"
            type="text"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />
          <button onClick={addDimension}>
            +
          </button>
        </div>
        <div className="my-8">
          {dimensions.map((dim, index) => (
            <div className="my-2" key={index}>
              {index + 1}. Width: {dim.width}, Height: {dim.height}
            </div>
          ))}
        </div>
      </div>


      <div className=''>
        <DimensionCuts panes={panes} paneWidth={paneWidth} paneHeight={paneHeight} />
      </div>

    </div>
  );
}

export default DimensionCuts;
