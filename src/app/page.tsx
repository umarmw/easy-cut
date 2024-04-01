'use client'
import React, { useState } from 'react';
import { Input } from "@nextui-org/react";
import Image from "next/image";
import { v4 as uuidv4 } from 'uuid';
import {Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, getKeyValue} from "@nextui-org/react";
import MyTable from '@/components/table';

import TableDemo from '@/components/datatable';

interface Dimension {
  id: string; 
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

  //sorting cuttings according to area
  dimensions.sort((a, b) => (b.width * b.height) - (a.width * a.height));

  // creating dim for cuttings
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




function paneRenderer(paneIndex: number, paneWidth: number, paneHeight: number, pane: Pane): JSX.Element {
  return (
    <React.Fragment key={paneIndex}>
      <h2>Pane {paneIndex }</h2>
      <div style={{ position: 'relative', width: paneWidth, height: paneHeight, border: '2px solid grey' }}>
        {pane.dimensions.map((dimension, index) => (
          <div
            key={dimension.id} 
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
  );
}


function DimensionCuts({ panes, paneWidth, paneHeight, startingPaneIndex = 1 }: { panes: Pane[]; paneWidth: number; paneHeight: number; startingPaneIndex?: number }): JSX.Element {
  let currentPaneIndex = startingPaneIndex;
  
  return (
    <React.Fragment>
      {panes.map((pane, index) => {
        currentPaneIndex++;

        return (
          <React.Fragment key={index}>
            <div style={{ marginRight: '20px' }}>
              {paneRenderer(currentPaneIndex - 1, paneWidth, paneHeight, pane)}
            </div>
            {pane.notFit && (
              <DimensionCuts
                panes={pane.notFit}
                paneWidth={paneWidth}
                paneHeight={paneHeight}
                startingPaneIndex={currentPaneIndex} // Increment startingPaneIndex for nested panes
              />
            )}
          </React.Fragment>
        );
      })}
    </React.Fragment>
  );
}


//----------------------------------------------------------------------------------


function App() {
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [paneWidth, setPaneWidth] = useState("");
  const [paneHeight, setPaneHeight] = useState("");

  const addDimension = () => {
    if (width && height) {
      const newDimension: Dimension = {
        id: uuidv4(), 
        width: parseInt(width),
        height: parseInt(height)
      };
      setDimensions([...dimensions, newDimension]);
      setWidth("");
      setHeight("");
    }
  };

  const panes: Pane[] = bestFitDecreasing(dimensions, parseInt(paneWidth), parseInt(paneHeight));

  // console.log(panes);

  return (
    <div>
        {/* <Table aria-label="Example table with dynamic content">
      <TableHeader columns={columns}>
        {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
      </TableHeader>
      <TableBody items={rows}>
        {(item) => (
          <TableRow key={item.key}>
            {(columnKey) => <TableCell>{getKeyValue(item, columnKey)}</TableCell>}
          </TableRow>
        )}
      </TableBody>
    </Table> */}
    <TableDemo />
      <h1 className='font-bold my-4 text-4xl'>Dimension Cuts</h1>
      <div className='flex gap-10'>
        <div className="pr-10">
          <div className="flex gap-4 ">
            <Input
              className="w-fit h-4"
              label="PanWidth"
              type="text"
              onChange={(e) => setPaneWidth(e.target.value)}
            />
            <Input
              className="w-fit h-4"
              label="PanHeight"
              type="text"
              onChange={(e) => setPaneHeight(e.target.value)}
            />
          </div>
          <div className="flex gap-4 py-10 items-baseline">
            <Input
              className="w-fit h-4"
              label="Width"
              type="text"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
            />
            <Input
              className="w-fit h-4"
             
              label="Height"
              type="text"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
            <button onClick={addDimension}>
              <Image
                src="/plus-symbol-button.png"
                width={20}
                height={20}
                alt="Picture of the author"
              />
            </button>
          </div>
          <div className="my-8">
            {dimensions.map((dim) => (
              <div className="my-2" key={dim.id}>
                Width: {dim.width}, Height: {dim.height}
              </div>
            ))}
          </div>
        </div>
        <div className=''>
          <DimensionCuts panes={panes} paneWidth={parseInt(paneWidth)} paneHeight={parseInt(paneHeight)} />
        </div>
      </div>
    </div>
  );
}

export default App;
