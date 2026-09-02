import React from 'react';

export function Card({ title }) {
  if (!title) {
    return null;
  }
  return <div>{title}</div>;
}