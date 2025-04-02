// app/(host)/listings/create.js
import React from 'react';
import CreateListingScreen from '../../../src/screens/host/CreateListingScreen';

export default function CreateListingRoute() {
  // On peut passer des props ou utiliser le contexte si nécessaire
  return <CreateListingScreen />;
}
