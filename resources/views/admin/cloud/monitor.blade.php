@include('include.header')



	 <section class="section">
		 <div class="container">

<h1 class="title">Monitoring</h1>


<table class="table is-fullwidth">
	<thead>
		<tr>
			<th>Timeout</th>
			<th>Status</th>
			<th>User</th>
			<th>Instance</th>
			<th>IP</th>

			<th></th>
		</tr>
	</thead>
	<tbody>
	
	
		   @foreach ($tasks as $task)
		   <tr>
				<td>{{$task->updated_at->diffInSeconds(\Carbon\Carbon::now())}}</td>
				<td>{{$task->status}}</td>
				<td>{{$task->user->name}}</td>
				<td>{{$task->instance_id}}</td>
				<td>{{$task->ip}}</td>
				<td>
				
				<form method="POST" action="{{route('update-cloud-task',['task_id' => $task->id])}}">
					@csrf
					 @method('PUT')
				
					 <button class="button is-danger">Stop</button>
					 </form>
				
				</td>
		   </tr>
    @endforeach
	</tbody>
</table>
		 
{{$tasks->onEachSide(5)->links()}}

    </div>

    </section>



@include('include.footer')