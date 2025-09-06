"use client";

import { doSomethingEffect } from "./actions";

export default function Client() {
  const handleClick = async () => {
    const result = await doSomethingEffect(1);
    console.log(result);
  };
  return (
    <div>
      <button onClick={handleClick}>Click me</button>
    </div>
  );
}
