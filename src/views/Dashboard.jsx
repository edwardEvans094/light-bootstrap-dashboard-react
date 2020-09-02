/*!

=========================================================
* Light Bootstrap Dashboard React - v1.3.0
=========================================================

* Product Page: https://www.creative-tim.com/product/light-bootstrap-dashboard-react
* Copyright 2019 Creative Tim (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/light-bootstrap-dashboard-react/blob/master/LICENSE.md)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
import React, { Component } from "react";
import ChartistGraph from "react-chartist";
import { Grid, Row, Col } from "react-bootstrap";
import Web3 from "web3"
import { BigNumber } from "bignumber.js";
import boostAbi from "../abi/boost"
import { Card } from "components/Card/Card.jsx";
import { StatsCard } from "components/StatsCard/StatsCard.jsx";
import { Tasks } from "components/Tasks/Tasks.jsx";
import {
  dataPie,
  legendPie,
  dataSales,
  optionsSales,
  responsiveSales,
  legendSales,
  dataBar,
  optionsBar,
  responsiveBar,
  legendBar
} from "variables/Variables.jsx";

const CONNTRACT_ADDDRESS = {
  COMP: "0x39CD2Fc7BAc954ABc3C1b6dA1CD467fA44f4f3BD",
  MKR: "0x40aFeF1b846D0a4EEf601Cf2B2117468eF63643C",
  AAVE: "0x383F3Ba9B39011f658e55a4c24c648851A4A8b60",
  SNX: "0xf8Cb70658F7eC2bdC51d65323300b4cd0B5c6301",
  KNC: "0x90dfbaDDf8f213185004bB200eDbB554E1F13D52",
  REN: "0x1dfF57d28C30F094235f0244939194B1223e66e1",
  YFI: "0x3EE27441449B2DfC705E3C237FFd75826870120A",
  LINK: "0x57fbd512a440CCE6832c62fD63c54A0A9f545F8a",
  BAND: "0x3080869CF796d944cB4fb3C47D7084f8E8D3d22a",
  SUSHI: "0xC7491fcDfc8af10d5a8Bc9C13b60B85209C0dc59"
}

const rpc = new Web3(new Web3.providers.HttpProvider("https://eth-mainnet.alchemyapi.io/jsonrpc/2thhmMgwp0GFa34gepu1rnU0w-96L4_g", 9000))
const contract = {
  COMP: new rpc.eth.Contract(boostAbi, CONNTRACT_ADDDRESS.COMP),
  MKR: new rpc.eth.Contract(boostAbi, CONNTRACT_ADDDRESS.MKR),
  AAV: new rpc.eth.Contract(boostAbi, CONNTRACT_ADDDRESS.AAVE),
  SNX: new rpc.eth.Contract(boostAbi, CONNTRACT_ADDDRESS.SNX),
  KNC: new rpc.eth.Contract(boostAbi, CONNTRACT_ADDDRESS.KNC),
  REN: new rpc.eth.Contract(boostAbi, CONNTRACT_ADDDRESS.REN),
  YFI: new rpc.eth.Contract(boostAbi, CONNTRACT_ADDDRESS.YFI),
  LIN: new rpc.eth.Contract(boostAbi, CONNTRACT_ADDDRESS.LINK),
  BAN: new rpc.eth.Contract(boostAbi, CONNTRACT_ADDDRESS.BAND),
  SUSHI: new rpc.eth.Contract(boostAbi, CONNTRACT_ADDDRESS.SUSHI)
}

const NUM_BLOCKS_PER_HOUR = 576

class Dashboard extends Component {
  constructor(){
    super()
    this.state = {
      holder: null,
      boostReward: 0,
      currentEachPoolReward: {},
      historyEachPoolReward: []
    }
  }
  componentDidMount = async () => {
    const holder = new URLSearchParams(this.props.location.search).get("holder")
    this.setState({
      holder: holder,
    }, this.fetch)
  }

  fetch = async () => {
    await this.getBoostReward()
    await this.getEachPoolReward()
  }

  createLegend(json) {
    var legend = [];
    for (var i = 0; i < json["names"].length; i++) {
      var type = "fa fa-circle text-" + json["types"][i];
      legend.push(<i className={type} key={i} />);
      legend.push(" ");
      legend.push(json["names"][i]);
    }
    return legend;
  }

  getBoostReward = async () => {
    let totalRewardWei = new BigNumber(0)
    if(this.state.holder){
      for (let i= 0; i< Object.keys(contract).length; i++){
        const poolContract = Object.values(contract)[i]
        const poolReward = await poolContract.methods.earned(this.state.holder).call()
        totalRewardWei = totalRewardWei.plus(poolReward)
      }
    }

    const totalBoostReward = totalRewardWei.div(Math.pow(10,18))
    this.setState({
      boostReward: totalBoostReward.toFixed(4).toString()
    })
  }

  getEachPoolReward = async () => {
    if(this.state.holder){
      // get current reward
      const currentPoolReward = await this.getEachPoolRewardAtBlockNumber()
      this.setState({currentEachPoolReward: currentPoolReward})
      console.log('------------- currentPoolReward', currentPoolReward)

      // get current block number

      const currentBlock = await rpc.eth.getBlockNumber()
      console.log("--------- current block --- ", currentBlock)
      const historyReward = []

      const arrayGetPoolReward = []
      const arrayGetBlock = []
      for (let i=0; i<12; i++){
        const shiftBlockNum = currentBlock - i * NUM_BLOCKS_PER_HOUR
        arrayGetPoolReward.unshift(this.getEachPoolRewardAtBlockNumber(shiftBlockNum))
        arrayGetBlock.unshift(rpc.eth.getBlock(shiftBlockNum))
      }
      const dataHistory = await Promise.all(arrayGetPoolReward)
      const dataBlocks = await Promise.all(arrayGetBlock)
      dataHistory.map((d,i) => {
        historyReward.push({
          timestamp: dataBlocks[i].timestamp,
          data: dataHistory[i]
        })
      })
      this.setState({
        historyEachPoolReward: historyReward
      })
      console.log("-----historyReward------------ ", historyReward)
    }
    
  }

  getEachPoolRewardAtBlockNumber = async (blockNum) => {
    if(!this.state.holder) return {}

    const poolReward = {}
    for (let i= 0; i< Object.keys(contract).length; i++){
      const poolContract = Object.values(contract)[i]
      const poolRewardWei = await poolContract.methods.earned(this.state.holder).call(undefined, blockNum)
      const bigPoolReward = new BigNumber(poolRewardWei)
      if(!bigPoolReward.isZero()){
        poolReward[Object.keys(contract)[i]] = bigPoolReward.div(Math.pow(10,18)).toFixed(4).toString()
      }
    }

    return poolReward
  }




  render() {
    const pieData = {
      labels: [],
      series: []
    }
    const legendPie = {
      names: [],
      // types: ["info", "danger", "warning"]
    };
    if(this.state.currentEachPoolReward && this.state.boostReward){
      Object.keys(this.state.currentEachPoolReward).map(poolSymbol => {
        legendPie.names.push(poolSymbol)
        pieData.labels.push(poolSymbol)
        pieData.series.push(this.state.currentEachPoolReward[poolSymbol] / this.state.boostReward * 100)
      })
    }

    const chartData = {
      labels: [],
      series: []
    };

    if(this.state.historyEachPoolReward && this.state.historyEachPoolReward.length && this.state.boostReward){
      const poolHaveReward = Object.keys(this.state.currentEachPoolReward)
      this.state.historyEachPoolReward.map(i => {
        const timeObj = new Date(i.timestamp * 1000)
        chartData.labels.push(`${("0" + timeObj.getHours()).slice(-2)}:${("0" + timeObj.getMinutes()).slice(-2)}`)
        poolHaveReward.map((poolName, poolIndex) => {
            if (!chartData.series[poolIndex]){
              chartData.series[poolIndex] = []
            }
            chartData.series[poolIndex].push(i.data[poolName])
        })
      })
      console.log("______chartData______", chartData)
    }

    return (
      <div className="content">
        <Grid fluid>
          <Row>
            <Col lg={3} sm={6}>
              <StatsCard
                bigIcon={<i className="pe-7s-server text-warning" />}
                statsText="Balance"
                statsValue={`${this.state.boostReward} BOOST`}
                statsIcon={<i className="fa fa-refresh" />}
                statsIconText="Updated now"
              />
            </Col>
            <Col lg={3} sm={6}>
              <StatsCard
                bigIcon={<i className="pe-7s-wallet text-success" />}
                statsText="Total value locked"
                statsValue="- USD"
                statsIcon={<i className="fa fa-calendar-o" />}
                statsIconText="Last day"
              />
            </Col>
            <Col lg={3} sm={6}>
              <StatsCard
                bigIcon={<i className="pe-7s-graph1 text-danger" />}
                statsText="Boost price"
                statsValue="- USD"
                statsIcon={<i className="fa fa-clock-o" />}
                statsIconText="In the last hour"
              />
            </Col>
            <Col lg={3} sm={6}>
              <StatsCard
                bigIcon={<i className="fa fa-twitter text-info" />}
                statsText="Total supply"
                statsValue="0.000 BOOST"
                statsIcon={<i className="fa fa-refresh" />}
                statsIconText="Updated now"
              />
            </Col>
          </Row>
          <Row>
            <Col md={8}>
              <Card
                statsIcon="fa fa-history"
                id="chartHours"
                title="Each Pool Reward"
                category="24 Hours performance"
                stats="Updated 5 minutes ago"
                content={
                  <div className="ct-chart">
                    <ChartistGraph
                      data={chartData}
                      type="Line"
                      options={optionsSales}
                      responsiveOptions={responsiveSales}
                    />
                  </div>
                }
                // legend={
                //   <div className="legend">{this.createLegend(legendSales)}</div>
                // }
              />
            </Col>
            <Col md={4}>
              <Card
                statsIcon="fa fa-clock-o"
                title="Pool Statistics"
                category="Last Pool Performance"
                stats="Percentage of each pool reward"
                content={
                  <div
                    id="chartPreferences"
                    className="ct-chart ct-perfect-fourth"
                  >
                    <ChartistGraph data={pieData} type="Pie" />
                  </div>
                }
                // legend={
                //   <div className="legend">{this.createLegend(legendPie)}</div>
                // }
              />
            </Col>
          </Row>

          {/* <Row>
            <Col md={6}>
              <Card
                id="chartActivity"
                title="2014 Sales"
                category="All products including Taxes"
                stats="Data information certified"
                statsIcon="fa fa-check"
                content={
                  <div className="ct-chart">
                    <ChartistGraph
                      data={dataBar}
                      type="Bar"
                      options={optionsBar}
                      responsiveOptions={responsiveBar}
                    />
                  </div>
                }
                legend={
                  <div className="legend">{this.createLegend(legendBar)}</div>
                }
              />
            </Col>

            <Col md={6}>
              <Card
                title="Tasks"
                category="Backend development"
                stats="Updated 3 minutes ago"
                statsIcon="fa fa-history"
                content={
                  <div className="table-full-width">
                    <table className="table">
                      <Tasks />
                    </table>
                  </div>
                }
              />
            </Col>
          </Row> */}
        </Grid>
      </div>
    );
  }
}

export default Dashboard;
