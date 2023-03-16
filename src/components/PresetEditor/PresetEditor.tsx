import React, { useCallback, useRef, useState } from "react";

import { Tooltip } from "@mui/material";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import { canCopyImagesToClipboard } from 'copy-image-clipboard'

import {
  resetSlots,
  selectPreset,
  setEquipmentSlot,
  setInventorySlot,
  updateSlotIndex,
  updateSlotType,
} from "../../redux/store/reducers/preset-reducer";
import { addToQueue, selectRecentItems } from "../../redux/store/reducers/recent-item-reducer";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { ItemData } from "../../types/inventory-slot";
import { SlotType } from "../../types/slot-type";
import { copyImageToClipboard, exportAsImage } from "../../utility/export-to-png";
import { DialogPopup } from "../ItemSelectDialogPopup/ItemSelectDialogPopup";
import { Equipment, Inventory } from "../SlotSection/SlotSection";

import "./PresetEditor.css";
import { ClipboardCopyButtonContainer } from "../ClipboardCopyButtonContainer/ClipboardCopyButtonContainer";
import { useSnackbar } from "notistack";

export const PresetEditor = () => {
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();

  const { presetName: name, inventorySlots, equipmentSlots, slotType, slotIndex } = useAppSelector(selectPreset);
  const recentItems = useAppSelector(selectRecentItems);

  const exportRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const handleSlotSelection = useCallback(
    (_event: React.MouseEvent<HTMLAreaElement>, index: number, className: string) => {
      if (className === "inventory") {
        dispatch(updateSlotType(SlotType.Inventory));
      } else {
        dispatch(updateSlotType(SlotType.Equipment));
      }

      dispatch(updateSlotIndex(index));
      setOpen(true);
    },
    [dispatch]
  );

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const changeSlot = useCallback(
    (index: number, item: ItemData) => {
      if (index === -1) {
        return;
      }

      if (slotType === SlotType.Inventory) {
        dispatch(setInventorySlot({ index, item }));
      } else {
        dispatch(setEquipmentSlot({ index, item }));
      }
      dispatch(addToQueue(item));
    },
    [dispatch, slotType, slotIndex]
  );

  const onReset = useCallback(() => {
    dispatch(resetSlots());
  }, []);

  const onSave = useCallback(async () => {
    await exportAsImage(exportRef.current, `PRESET_${name.replaceAll(" ", "_")}`);
  }, [name]);

  const onCopyToClipboard = useCallback(async () => {
    await copyImageToClipboard(exportRef.current, () => {
      enqueueSnackbar("Failed to copy image to clipboard", { variant: 'error'});
    });
  }, []);

  return (
    <>
      <Card className="container">
        <CardContent data-id="content" className="preset-container">
          <div ref={exportRef}>
            <map name="presetmap">
              <Inventory slots={inventorySlots} handleClickOpen={handleSlotSelection} />
              <Equipment slots={equipmentSlots} handleClickOpen={handleSlotSelection} />
            </map>
            <img
              width={510}
              height={163}
              id="preset-background"
              src="https://i.imgur.com/O7VznNO.png"
              useMap="#presetmap"
              alt="preset background"
            />
          </div>
        </CardContent>
        <CardActions className="preset-buttons">
          <Button color="error" variant="contained" size="small" onClick={onReset}>
            Reset
          </Button>
          <Button color="success" variant="contained" size="small" onClick={onSave}>
            Save as PNG
          </Button>
          <ClipboardCopyButtonContainer className="preset-buttons__button">
            <Button
              color="secondary"
              variant="outlined"
              size="small"
              disabled={!canCopyImagesToClipboard()}
              onClick={onCopyToClipboard}
            >
              Copy Image to Clipboard
            </Button>
          </ClipboardCopyButtonContainer>
        </CardActions>
      </Card>
      <DialogPopup
        open={open}
        recentlySelectedItems={recentItems}
        handleClose={handleClose}
        handleSlotChange={changeSlot}
      />
    </>
  );
};