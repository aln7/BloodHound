import React, { Component } from 'react';
import NodeALink from './NodeALink'

export default class GroupNodeData extends Component {
	propTypes: {
		visible : React.PropTypes.bool.isRequired
	}

	constructor(){
		super();

		this.state = {
			label: "",
			directMembers: -1,
			unrolledMembers: -1,
			directAdminTo: -1,
			derivativeAdminTo: -1,
			unrolledMemberOf: -1,
			sessions: -1,
			foreignGroupMembership: -1,
			ownedInWave: "None"
		}

		emitter.on('groupNodeClicked', this.getNodeData.bind(this));
	}

	getNodeData(payload){
		this.setState({
			label: payload,
			directMembers: -1,
			unrolledMembers: -1,
			directAdminTo: -1,
			derivativeAdminTo: -1,
			unrolledMemberOf: -1,
			sessions: -1,
			foreignGroupMembership: -1,
			ownedInWave: "None"
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

		s1.run("MATCH (a)-[b:MemberOf]->(c:Group {name:{name}}) RETURN count(a)", {name:payload})
			.then(function(result){
				this.setState({'directMembers':result.records[0]._fields[0].low})
				s1.close()
			}.bind(this))

		s2.run("MATCH (n:User), (m:Group {name:{name}}), p=allShortestPaths((n)-[:MemberOf*1..]->(m)) WITH nodes(p) AS y RETURN count(distinct(filter(x in y WHERE labels(x)[0] = 'User')))", {name:payload})
			.then(function(result){
				this.setState({'unrolledMembers':result.records[0]._fields[0].low})
				s2.close()
			}.bind(this))

		s3.run("MATCH (n:Group {name:{name}})-[r:AdminTo]->(m:Computer) RETURN count(distinct(m))", {name:payload})
			.then(function(result){
				this.setState({'directAdminTo':result.records[0]._fields[0].low})
				s3.close()
			}.bind(this))

		s4.run("MATCH (n:Group {name:{name}}), (target:Computer), p=shortestPath((n)-[*]->(target)) RETURN count(p)", {name:payload})
			.then(function(result){
				this.setState({'derivativeAdminTo':result.records[0]._fields[0].low})
				s4.close()
			}.bind(this))

		s5.run("MATCH (n:Group {name:{name}}), (target:Group), p=shortestPath((n)-[r:MemberOf*1..]->(target)) RETURN count(p)", {name:payload})
			.then(function(result){
				this.setState({'unrolledMemberOf':result.records[0]._fields[0].low})
				s5.close()
			}.bind(this))

		s6.run("MATCH p=shortestPath((m:User)-[r:MemberOf*1..]->(n:Group {name: {name}})) WITH m,p MATCH q=((m)<-[:HasSession]-(o:Computer)) RETURN count(o)", {name:payload})
			.then(function(result){
				this.setState({'sessions':result.records[0]._fields[0].low})
				s6.close()
			}.bind(this))

		s7.run("MATCH (n:Group) WHERE NOT n.name ENDS WITH {domain} WITH n MATCH (m:Group {name:{name}}) MATCH (m)-[r:MemberOf]->(n) RETURN count(n)", {name:payload, domain:domain})
			.then(function(result){
				this.setState({'foreignGroupMembership':result.records[0]._fields[0].low})
				s7.close()
			}.bind(this))

		s8.run("MATCH (n {name:{name}}) RETURN n.wave", {name:payload})
			.then(function(result){
				if (result.records[0]._fields[0] != null) {
					this.setState({'ownedInWave':result.records[0]._fields[0].low})
				} else {
					this.setState({'ownedInWave':'None'})
				}
				s8.close()
			}.bind(this))
	}

	render() {
		var domain = '@' + this.state.label.split('@')
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
						Direct Members
					</dt>
					<dd>
						<NodeALink 
							ready={this.state.directMembers !== -1}
							value={this.state.directMembers}
							click={function(){
								emitter.emit('query', "MATCH (n)-[r:MemberOf]->(m:Group {name:{name}}) RETURN n,r,m", {name: this.state.label})
							}.bind(this)} />
					</dd>
					<dt>
						Unrolled Members
					</dt>
					<dd>
						<NodeALink
							ready={this.state.unrolledMembers !== -1}
							value={this.state.unrolledMembers}
							click={function(){
								emitter.emit('query', "MATCH (n:User), (m:Group {name:{name}}), p=shortestPath((n)-[:MemberOf*1..]->(m)) RETURN p", {name: this.state.label},
									this.state.label)
							}.bind(this)} />
					</dd>
					<br />
					<dt>
						Direct Admin To
					</dt>
					<dd>
						<NodeALink
							ready={this.state.directAdminTo !== -1}
							value={this.state.directAdminTo}
							click={function(){
								emitter.emit('query', "MATCH p=shortestPath((n:Group {name:{name}})-[r:AdminTo]->(m:Computer)) RETURN p", {name: this.state.label},
									this.state.label)
							}.bind(this)} />
					</dd>
					<br />
					<dt>
						Derivative Admin To
					</dt>
					<dd>
						<NodeALink
							ready={this.state.derivativeAdminTo !== -1}
							value={this.state.derivativeAdminTo}
							click={function(){
								emitter.emit('query', "MATCH (n:Group {name:{name}}), (target:Computer), p=shortestPath((n)-[*]->(target)) RETURN p", {name: this.state.label},
									this.state.label)
							}.bind(this)} />
					</dd>
					<dt>
						Unrolled Member Of
					</dt>
					<dd>
						<NodeALink
							ready={this.state.unrolledMemberOf !== -1}
							value={this.state.unrolledMemberOf}
							click={function(){
								emitter.emit('query', "MATCH (n:Group {name:{name}}), (target:Group), p=shortestPath((n)-[r:MemberOf*1..]->(target)) RETURN p", {name: this.state.label},
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
								emitter.emit('query', "MATCH (n:Group) WHERE NOT n.name ENDS WITH {domain} WITH n MATCH (m:Group {name:{name}}) MATCH (m)-[r:MemberOf]->(n) RETURN m,r,n", {name: this.state.label, domain: domain})
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
								emitter.emit('query', "MATCH p=shortestPath((m:User)-[r:MemberOf*1..]->(n:Group {name: {name}})) WITH m,p MATCH q=((m)<-[:HasSession]-(o:Computer)) RETURN q,p", {name: this.state.label},
									"",this.state.label)
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
				</dl>
			</div>
		);
	}
}
