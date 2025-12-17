import React from "react";
import { NavLink } from "react-router-dom";
import "./Navbar.css";

// آیکون‌ها
import Wallet from "../../assets/wallet.png";
import Task from "../../assets/aboutus.png";
import Stake from "../../assets/stake.png";
import Mine from "../../assets/mine.png";
import Friend from "../../assets/friends.png";

const Navbar = () => {
  return (
    <nav className="navbar">
      <NavLink to="/mine" className="nav-item">
        <img src={Mine} alt="Mine icon" />
        <span>Mine</span>
      </NavLink>

      <NavLink to="/" className="nav-item">
        <img src={Stake} alt="Stake icon" />
        <span>Stake</span>
      </NavLink>

      <NavLink to="/friend" className="nav-item">
        <img src={Friend} alt="Friends icon" />
        <span>Friends</span>
      </NavLink>

      <NavLink to="/Aboutus" className="nav-item">
        <img src={Task} alt="Tasks icon" />
        <span>About Us</span>
      </NavLink>

      <NavLink to="/wallets" className="nav-item">
        <img src={Wallet} alt="Wallets icon" />
        <span>Wallets</span>
      </NavLink>
    </nav>
  );
};

export default Navbar;
