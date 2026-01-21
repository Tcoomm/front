import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { renamePresentation, selectPresentation } from "../../store";
import s from "./TitleBar.module.css";

export default function TitleBar() {
  const title = useSelector(selectPresentation).title;
  const dispatch = useDispatch();

  return (
    <div className={s.root}>
      <input
        className={s.input}
        value={title}
        onChange={(e) => dispatch(renamePresentation(e.target.value))}
      />
    </div>
  );
}
