import React from 'react';
import './App.css';
import SaladBowl from "./components/SaladBowl";
import {Container} from "@material-ui/core";

function App() {
    return (
        <Container className="App">
            <SaladBowl/>
        </Container>
    );
}

export default App;
