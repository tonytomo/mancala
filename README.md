# Mancala Game

<img src="assets/dakon.JPG" width="507" height="190"/>

*This is a traditional game built using pure HTML, CSS, and JavaScript.*

-----

## What is Dakon?

Dakon, also known as Congklak/Mancala in some regions, is a popular traditional board game played across the globe, especially in Indonesia. Players typically use **cowrie shells** as game pieces, though **seeds** or **small stones** are also common alternatives.

-----

## How to Play

Dakon/Mancala is a **turn-based game** where players take turns distributing "seeds" around a board. Here are the rules:

1.  **Turns:** Only one player can make a move at a time. The other player must wait until their turn begins.
2.  **The Board:** Each player has a "region" with **seven small holes** and **one larger "barn"** (or "lumbung").
3.  **Starting a Turn:** On your turn, choose one of the small holes in your region and pick up all the seeds from it.
4.  **Distributing Seeds:** Move clockwise, dropping one seed into each subsequent hole, **skipping your opponent's barn**.
5.  **Continuing Your Turn (Collecting Seeds):** If the last seed in your hand lands in a hole that already contains seeds, **collect all the seeds from that hole** and continue distributing them as in rule 4.
6.  **Continuing Your Turn (Landing in Your Barn):** If the last seed in your hand lands in your own barn, **you get to take another turn** from any hole in your region (as in rule 3).
7.  **Capturing Seeds:** If the last seed in your hand lands in an **empty hole in your own region**, you capture all the seeds from that hole and all the seeds from the **opposite hole in your opponent's region**. All captured seeds go into your barn.
8.  **Ending Your Turn:** If the last seed in your hand lands in an **empty hole in your opponent's region**, your turn ends.
9.  **Game End:** The game ends when all the small holes in a player's region are empty at the start of their turn. All remaining seeds in the small holes are then moved to their respective player's barn. The player with the most seeds in their barn wins.

-----

## Features (Current)

  * **Player vs. Bot or Player vs. Player (PvP):** Play against an AI opponent or challenge a friend.
  * **Difficulty Levels:**
      * **EASY:** Random moves.
      * **MEDIUM:** Best of 1 spin.
      * **EXPERT:** Best of 3 spin.
  * **Configurable Starting Seeds:** Adjust the initial number of seeds in each hole.
  * **Debugging Log:** Utilize the `addLog('message');` function for real-time debugging.

-----

Feel free to play\! If you encounter any bugs, please let us know.
