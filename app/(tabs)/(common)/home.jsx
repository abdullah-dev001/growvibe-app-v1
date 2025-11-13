import React from "react";
import { View } from "react-native";
import { useSelector } from "react-redux";
import Dashboard from "../../../components/Dashboard";
import Home from "../../../components/Home";

const home = () => {
  const {user, branchId, schoolId} = useSelector((state) => state.auth)
    
  return (
    <View style={{ flex: 1 }}>
      {["owner", "admin", "principal", "coordinator"].includes(user?.role) ? (
        <Dashboard />
      ) : (
        <Home />
      )}
    </View>
  );
};

export default home;
