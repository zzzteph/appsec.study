@include('include.header')



	 <section class="section">
		 <div class="container">
		 

<form method="POST" action="{{route('create-vms')}}">
@csrf
<div class="field is-grouped">

   <p class="control">
<div class="select">
  <select name="type">
    <option value="lab" selected>lab</option>
	 <option value="code">code</option>
  </select>
</div>
  </p>

  <p class="control is-expanded">
    <input class="input" name="name" type="text" placeholder="VM Name">
  </p>
  

    <p class="control is-expanded">
    <input class="input" name="cloud_id" type="text" placeholder="Cloud Id">
  </p>
      <p class="control is-expanded">
  <input class="input" name="size" type="text" name="size"  value="13958643712">
   </p>
  <p class="control">
    <button class="button is-success">
      Create
    </a>
  </p>
</div>

</form>



<table class="table is-fullwidth">
	<thead>
		<tr>
		    <th>Type</th>
			<th>VM name</th>
			<th>Cloud template</th>
			<th>Size</th>
			<th>Update</th>
			<th>Delete</th>
		</tr>
	</thead>
	<tbody>
	
	
		   @foreach ($vms as $vm)
		   <tr>
		   
		   <form method="POST" action="{{route('update-vms',['id' => $vm->id])}}">
		   					@csrf
					 @method('PUT')
		
				<td>
				<div class="select">
  <select name="type">
	@if($vm->type=="lab")
    <option value="lab" selected>lab</option>
	@else 
	<option value="lab">lab</option>
	@endif
	
	@if($vm->type=="code")
	 <option value="code" selected>code</option>
 @else 
	<option value="code">code</option>
	@endif
  </select>
</div>
				
				</td>
		
		
				<td>
				
				<input class="input" name="name" type="text"  name="name" value="{{ $vm->name }}">
				
				</td>
				<td>
				
					<input class="input" name="cloud_id" type="text" name="cloud_id"  value="{{ $vm->cloud->template_id }}">
				</td>
				
				<td>
				@if(!empty( $vm->vm_config->size))
					<input class="input" name="size" type="text" name="size"  value="{{ $vm->vm_config->size }}">
				@else
					<input class="input" name="size" type="text" name="size"  value="0">
				@endif
				</td>
				
				
				<td>
					

					 <button class="button is-success">Update</button>
					
				</td>
				 </form>
				
				<td>
									<form method="POST" action="{{route('delete-vms',['id' => $vm->id])}}">
					@csrf
					 @method('DELETE')
				
					 <button class="button is-danger">Delete</button>
					 </form>
				
				
				</td>
		   </tr>
    @endforeach
	</tbody>
</table>
		 
{{$vms->onEachSide(5)->links()}}

    </div>

    </section>



@include('include.footer')