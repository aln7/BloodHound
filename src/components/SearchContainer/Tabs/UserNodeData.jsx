import React, { Component } from 'react';
import NodeALink from './NodeALink'

export default class UserNodeData extends Component {
	propTypes: {
		visible : React.PropTypes.bool.isRequired
	}

	constructor(){
		super();

		this.state = {
			label: "",
			samAccountName: "None",
			displayName: "None",
			pwdLastChanged: "None",
			firstDegreeGroupMembership: -1,
			unrolledGroupMembership: -1,
			foreignGroupMembership: -1,
			firstDegreeLocalAdmin: -1,
			groupDelegatedLocalAdmin: -1,
			derivativeLocalAdmin: -1,
			sessions: -1,
			ownedInWave: "None",
			ownedMethod: "None"
		}

		emitter.on('userNodeClicked', this.getNodeData.bind(this));
	}

	getNodeData(payload){
		this.setState({
			label: payload,
			samAccountName: "None",
			displayName: "None",
			pwdLastChanged: "None",
			firstDegreeGroupMembership: -1,
			unrolledGroupMembership: -1,
			foreignGroupMembership: -1,
			firstDegreeLocalAdmin: -1,
			groupDelegatedLocalAdmin: -1,
			derivativeLocalAdmin: -1,
			sessions: -1,
			ownedInWave: "None",
			ownedMethod: "None"
		})

		var domain = '@' + payload.split('@').last()
		
		var s1 = driver.session()
		var s2 = driver.session()
		var s3 = driver.session()
		var s4 = driver.session()
		var s5 = driver.session()
		var s6 = driver.session()
		var s7 = driver.session()
		var s8 = driver.session()
		var s9 = driver.session()

		s1.run("MATCH (n:Group) WHERE NOT n.name ENDS WITH {domain} WITH n MATCH (m:User {name:{name}}) MATCH (m)-[r:MemberOf*1..]->(n) RETURN count(n)", {name:payload, domain: domain})
			.then(function(result){
				this.setState({'foreignGroupMembership':result.records[0]._fields[0].low})
				s1.close()
			}.bind(this))

		s2.run("MATCH (n:User {name:{name}}), (m:Group), p=shortestPath((n)-[:MemberOf*1]->(m)) RETURN count(m)", {name:payload})
			.then(function(result){
				this.setState({'firstDegreeGroupMembership':result.records[0]._fields[0].low})
				s2.close()
			}.bind(this))

		s3.run("MATCH (n:User {name:{name}}), (target:Group), p=shortestPath((n)-[:MemberOf*1..]->(target)) RETURN count(target)", {name:payload})
			.then(function(result){
				this.setState({'unrolledGroupMembership':result.records[0]._fields[0].low})
				s3.close()
			}.bind(this))

		s4.run("MATCH (n:User {name:{name}}), (target:Computer), p=shortestPath((n)-[:AdminTo*1]->(target)) RETURN count(target)", {name:payload})
			.then(function(result){
				this.setState({'firstDegreeLocalAdmin':result.records[0]._fields[0].low})
				s4.close()
			}.bind(this))

		s5.run("MATCH p=shortestPath((n:User {name:{name}})-[r*1..]->(m:Computer)) WHERE NONE(rel in rels(p) WHERE type(rel)='HasSession') WITH p WHERE ANY(rel in rels(p) WHERE type(rel)='MemberOf') RETURN count(p)", {name:payload})
			.then(function(result){
				this.setState({'groupDelegatedLocalAdmin':result.records[0]._fields[0].low})
				s5.close()
			}.bind(this))

		s6.run("MATCH (n:User {name:{name}}), (target:Computer), p=shortestPath((n)-[*]->(target)) RETURN count(p)", {name:payload})
			.then(function(result){
				this.setState({'derivativeLocalAdmin':result.records[0]._fields[0].low})
				s6.close()
			}.bind(this))

		s7.run("MATCH (n:Computer)-[r:HasSession]->(m:User {name:{name}}) RETURN count(n)", {name:payload})
			.then(function(result){
				this.setState({'sessions':result.records[0]._fields[0].low})
				s7.close()
			}.bind(this))

		s8.run("MATCH (n {name:{name}}) RETURN n.wave", {name:payload})
			.then(function(result){
				if (result.records[0]._fields[0] != null) {
					this.setState({'ownedInWave':result.records[0]._fields[0].low})
				} 
				s8.close()
			}.bind(this))

		s9.run("MATCH (n {name:{name}}) RETURN n.owned", {name:payload})
			.then(function(result){
				if (result.records[0]._fields[0] != null) {
					this.setState({'ownedMethod':result.records[0]._fields[0]})
				} 
				s9.close()
			}.bind(this))
	}

	render() {
		var domain = '@' + this.state.label.split('@').last()
		return (
			<div className={this.props.visible ? "" : "displaynone"}>
				<dl className='dl-horizontal'>
					<dt>
						Node
					</dt>
					<dd>
						{this.state.label}
					</dd>
					<br />
					<dt>
						SAMAccountName
					</dt>
					<dd>
						{this.state.samAccountName}
					</dd>
					<dt>
						Display Name
					</dt>
					<dd>
						{this.state.displayName}
					</dd>
					<dt>
						Password Last Changed
					</dt>
					<dd>
						{this.state.pwdLastChanged}
					</dd>
					<br />
					<dt>
						First Degree Group Memberships
					</dt>
					<dd>
						<NodeALink 
							ready={this.state.firstDegreeGroupMembership !== -1}
							value={this.state.firstDegreeGroupMembership}
							click={function(){
								emitter.emit(
									'query',
									"MATCH (n:User {name:{name}}), (target:Group),p=shortestPath((n)-[:MemberOf*1]->(target)) RETURN p", {name:this.state.label}
									)
							}.bind(this)} />
					</dd>
					<dt>
						Unrolled Group Memberships
					</dt>
					<dd>
						<NodeALink
							ready={this.state.unrolledGroupMembership !== -1}
							value={this.state.unrolledGroupMembership}
							click={function(){
								emitter.emit('query', "MATCH (n:User {name:{name}}), (target:Group),p=shortestPath((n)-[:MemberOf*1..]->(target)) RETURN p", {name:this.state.label},
									this.state.label)
							}.bind(this)} />
					</dd>
					<dt>
						Foreign Group Membership
					</dt>
					<dd>
						<NodeALink
							ready={this.state.foreignGroupMembership !== -1}
							value={this.state.foreignGroupMembership}
							click={function(){
								emitter.emit('query', 
									"MATCH (n:Group) WHERE NOT n.name ENDS WITH {domain} WITH n MATCH (m:User {name:{name}}) WITH n,m MATCH p = (m)-[r:MemberOf*1..]->(n) RETURN p", {name: this.state.label, domain: domain})
							}.bind(this)} />
					</dd>
					<br />
					<dt>
						First Degree Local Admin
					</dt>
					<dd>
						<NodeALink
							ready={this.state.firstDegreeLocalAdmin !== -1}
							value={this.state.firstDegreeLocalAdmin}
							click={function(){
								emitter.emit('query', "MATCH (n:User {name:{name}}), (target:Computer), p=shortestPath((n)-[:AdminTo*1]->(target)) RETURN p", {name:this.state.label})
							}.bind(this)} />
					</dd>
					<dt>
						Group Delegated Local Admin Rights
					</dt>
					<dd>
						<NodeALink
							ready={this.state.groupDelegatedLocalAdmin !== -1}
							value={this.state.groupDelegatedLocalAdmin}
							click={function(){
								emitter.emit('query', "MATCH p=shortestPath((n:User {name:{name}})-[r*1..]->(m:Computer)) WHERE NONE(rel in rels(p) WHERE type(rel)='HasSession') WITH p WHERE ANY(rel in rels(p) WHERE type(rel)='MemberOf') RETURN p", {name:this.state.label}
									,this.state.label)
							}.bind(this)} />
					</dd>
					<dt>
						Derivative Local Admin Rights
					</dt>
					<dd>
						<NodeALink
							ready={this.state.derivativeLocalAdmin !== -1}
							value={this.state.derivativeLocalAdmin}
							click={function(){	
								emitter.emit('query', "MATCH (n:User {name:{name}}), (m:Computer), p=shortestPath((n)-[*]->(m)) RETURN p", {name:this.state.label}
									,this.state.label)
							}.bind(this)} />
					</dd>
					<dt>
						Sessions
					</dt>
					<dd>
						<NodeALink
							ready={this.state.sessions !== -1}
							value={this.state.sessions}
							click={function(){
								emitter.emit('query', "MATCH (n:Computer)-[r:HasSession]->(m:User {name:{name}}) RETURN n,r,m", {name:this.state.label}
									,this.state.label)
							}.bind(this)} />
					</dd>
					<br />
                                        <dt>
                                                Owned in Wave
                                        </dt>
                                        <dd>
						<NodeALink
							ready={this.state.ownedInWave !== -1}
							value={this.state.ownedInWave}
							click={function(){
								emitter.emit('query', "OPTIONAL MATCH (n1:User {wave:{wave}}) WITH collect(distinct n1) as c1 OPTIONAL MATCH (n2:Computer {wave:{wave}}) WITH collect(distinct n2) + c1 as c2 OPTIONAL MATCH (n3:Group {wave:{wave}}) WITH c2, collect(distinct n3) + c2 as c3 UNWIND c2 as n UNWIND c3 as m MATCH (n)-[r]->(m) RETURN n,r,m", {wave:this.state.ownedInWave}
									,this.state.label)
							}.bind(this)} />
                                        </dd>
                                        <dt>
                                                Owned via Method
                                        </dt>
                                        <dd>
                                                {this.state.ownedMethod}
                                        </dd>
				</dl>
			</div>
		);
	}
}
