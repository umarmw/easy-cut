'use client'

import React, { useState } from "react";
import CreateIcon from "@material-ui/icons/Create";
import {
    Box, Button, Snackbar, Table,
    TableBody, TableCell, TableHead, TableRow
} from "@material-ui/core";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import AddBoxIcon from "@material-ui/icons/AddBox";
import DoneIcon from "@material-ui/icons/Done";
import ClearIcon from "@material-ui/icons/Clear";
import { makeStyles } from "@material-ui/core/styles";
import Alert from "@material-ui/lab/Alert";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";



// import React, { useState } from 'react';
import { Input } from "@nextui-org/react";
import Image from "next/image";
import { v4 as uuidv4 } from 'uuid';
// import {Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, getKeyValue} from "@nextui-org/react";
import MyTable from '@/components/table';

// import TableDemo from '@/components/datatable';

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

//-------------------------------------------------------------------------------

interface Row {
    id: number;
    height: string;
    width: string;
    city: string;
}

// Creating styles
const useStyles = makeStyles({
    root: {
        "& > *": {
            borderBottom: "unset",
        },
    },
    table: {
        minWidth: 650,
    },
    snackbar: {
        bottom: "104px",
    },
});

function TableDemo() {



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



//-----------------------------------------------------------------------------
    // Creating style object
    const classes = useStyles();

    // Defining a state named rows
    // which we can update by calling on setRows function
    const [rows, setRows] = useState<Row[]>([
        { id: 1, height: "", width: "", city: "" },
    ]);

    // Initial states
    const [open, setOpen] = React.useState(false);
    const [isEdit, setEdit] = React.useState(false);
    const [disable, setDisable] = React.useState(true);
    const [showConfirm, setShowConfirm] = React.useState(false);

    // Function For closing the alert snackbar
    const handleClose = (event: React.SyntheticEvent | React.MouseEvent, reason?: string) => {
        if (reason === "clickaway") {
            return;
        }
        setOpen(false);
    };

    // Function For adding new row object
    const handleAdd = () => {
        setRows([
            ...rows,
            {
                id: rows.length + 1, height: "",
                width: "", city: ""
            },
        ]);
        setEdit(true);
    };

    // Function to handle edit
    const handleEdit = (i: number) => {
        // If edit mode is true setEdit will 
        // set it to false and vice versa
        setEdit(!isEdit);
    };

    // Function to handle save
    const handleSave = () => {
        setEdit(!isEdit);
        console.log("saved : ", rows);
        setDisable(true);
        setOpen(true);
    };

    // The handleInputChange handler can be set up to handle
    // many different inputs in the form, listen for changes 
    // to input elements and record their values in state
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, index: number) => {
        setDisable(false);
        const { name, value } = e.target;
        const list = [...rows];
        list[index][name] = value;
        setRows(list);
    };

    // Showing delete confirmation to users
    const handleConfirm = () => {
        setShowConfirm(true);
    };

    // Handle the case of delete confirmation where 
    // user click yes delete a specific row of id:i
    const handleRemoveClick = (i: number) => {
        const list = [...rows];
        list.splice(i, 1);
        setRows(list);
        setShowConfirm(false);
    };

    // Handle the case of delete confirmation 
    // where user click no 
    const handleNo = () => {
        setShowConfirm(false);
    };

    return (

        
        <TableBody className="">
            <Snackbar
                open={open}
                autoHideDuration={2000}
                onClose={handleClose}
                className={classes.snackbar}
            >
                <Alert onClose={handleClose} severity="success">
                    Record saved successfully!
                </Alert>
            </Snackbar>
            <Box margin={1} className="">
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                        {isEdit ? (
                            <div>
                                <Button onClick={handleAdd}>
                                    <AddBoxIcon onClick={handleAdd} />
                                    ADD
                                </Button>
                                {rows.length !== 0 && (
                                    <div>
                                        {disable ? (
                                               <Button disabled align="right" onClick={handleSave}>
                                                <DoneIcon />
                                                DONE
                                            </Button>
                                        ) : (
                                            <Button align="right" onClick={handleSave}>
                                                <DoneIcon />
                                                DONE
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                <Button onClick={handleAdd}>
                                    <AddBoxIcon onClick={handleAdd} />
                                    ADD
                                </Button>
                                <Button align="right" onClick={handleEdit}>
                                    <CreateIcon />
                                    EDIT
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
                <TableRow align="center"></TableRow>

                <Table
                    className={classes.table}
                    size="small"
                    aria-label="a dense table"
                >
                    <TableHead>
                        <TableRow>
                            <TableCell>Height</TableCell>
                            <TableCell>Width</TableCell>
                            {/* <TableCell align="center">City</TableCell> */}
                            <TableCell align="center"></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row, i) => {
                            return (
                                <div key={i}>
                                    <TableRow>
                                        {isEdit ? (
                                            <div>
                                                <TableCell padding="none">
                                                    <input
                                                        value={row.height}
                                                        name="height"
                                                        onChange={(e) =>
                                                            handleInputChange(e, i)}
                                                    />
                                                </TableCell>
                                                <TableCell padding="none">
                                                    <input
                                                        value={row.width}
                                                        name="width"
                                                        onChange={(e) =>
                                                            handleInputChange(e, i)}
                                                    />
                                                </TableCell>
                                                {/* <TableCell padding="none">
                                                    <select
                                                        style={{ width: "100px" }}
                                                        name="city"
                                                        value={row.city}
                                                        onChange={(e) =>
                                                            handleInputChange(e, i)}
                                                    >
                                                        <option value=""></option>
                                                        <option value="Karanja">
                                                            Karanja
                                                        </option>
                                                        <option value="Hingoli">
                                                            Hingoli
                                                        </option>
                                                        <option value="Bhandara">
                                                            Bhandara
                                                        </option>
                                                        <option value="Amaravati">
                                                            Amaravati
                                                        </option>
                                                        <option value="Pulgaon">
                                                            Pulgaon
                                                        </option>
                                                    </select>
                                                </TableCell> */}
                                            </div>
                                        ) : (
                                            <div>
                                                <TableCell component="th" scope="row">
                                                    {row.height}
                                                </TableCell>
                                                <TableCell component="th" scope="row">
                                                    {row.width}
                                                </TableCell>
                                                {/* <TableCell component="th"
                                                    scope="row"
                                                    align="
                                                    center">
                                                    {row.city}
                                                </TableCell> */}
                                                <TableCell
                                                    component="th"
                                                    scope="row"
                                                    align="center"
                                                ></TableCell>
                                            </div>
                                        )}
                                        {isEdit ? (
                                            <Button className="mr10" onClick={handleConfirm}>
                                                <ClearIcon />
                                            </Button>
                                        ) : (
                                            <Button className="mr10" onClick={handleConfirm}>
                                                <DeleteOutlineIcon />
                                            </Button>
                                        )}
                                        {showConfirm && (
                                            <div>
                                                <Dialog
                                                    open={showConfirm}
                                                    onClose={handleNo}
                                                    aria-labelledby="alert-dialog-title"
                                                    aria-describedby="alert-dialog-description"
                                                >
                                                    <DialogTitle id="alert-dialog-title">
                                                        {"Confirm Delete"}
                                                    </DialogTitle>
                                                    <DialogContent>
                                                        <DialogContentText
                                                            id="alert-dialog-description"
                                                        >
                                                            Are you sure to delete
                                                        </DialogContentText>
                                                    </DialogContent>
                                                    <DialogActions>
                                                        <Button
                                                            onClick={() =>
                                                                handleRemoveClick(i)
                                                            }
                                                            color="primary"
                                                            autoFocus
                                                        >
                                                            Yes
                                                        </Button>
                                                        <Button
                                                            onClick={handleNo}
                                                            color="primary"
                                                            autoFocus
                                                        >
                                                            No
                                                        </Button>
                                                    </DialogActions>
                                                </Dialog>
                                            </div>
                                        )}
                                    </TableRow>
                                </div>
                            );
                        })}
                    </TableBody>
                </Table>
            </Box>


{/* <Box margin={1} className="">
    <div>
        <h2>Saved Height and Width Values:</h2>
        <ul>
            {rows.map((row, index) => (
                <li key={index}>
                    Height: {row.height}, Width: {row.width}
                </li>
            ))}
        </ul>
    </div>
</Box>


<li>-------------------------------------------------------------</li> */}







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
        </TableBody>
    );
}

export default TableDemo;
